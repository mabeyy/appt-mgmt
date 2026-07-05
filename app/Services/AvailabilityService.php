<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Staff;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * The single source of truth for every scheduling rule: overlap/double-booking,
 * business hours, working days, staff availability, per-day capacity, and the
 * open-slot computation used by the public booking page. Consumed by both the
 * admin appointment forms and the public booking endpoint so the rules never drift.
 */
class AvailabilityService
{
    /**
     * Is a single staff resource free for the given slot?
     * Returns true for unassigned bookings (no single calendar to collide with).
     */
    public function isSlotAvailable(
        string $date,
        string $startTime,
        int $duration,
        ?int $staffId,
        ?int $ignoreId = null,
    ): bool {
        if (! $staffId) {
            return true;
        }

        $tz = Setting::get('timezone');
        $buffer = (int) Setting::get('buffer_time', 0);
        $start = Carbon::parse("$date $startTime", $tz);
        $end = $start->copy()->addMinutes($duration);

        $existing = Appointment::query()
            ->where('staff_id', $staffId)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->get();

        return ! $this->collides($existing, $start, $end, $buffer);
    }

    /**
     * Evaluate every rule. Pure — returns a field => message map (empty == valid).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    public function violations(array $data, ?Appointment $ignore = null): array
    {
        $date = $data['appointment_date'] ?? null;
        $startTime = $data['start_time'] ?? null;
        $duration = (int) ($data['duration'] ?? 0);

        // Shape validation (required/format) is handled by the FormRequest.
        if (! $date || ! $startTime || $duration <= 0) {
            return [];
        }

        $settings = Setting::values();
        $tz = $settings['timezone'] ?? config('app.timezone');
        $staffId = $data['staff_id'] ?? null;
        $enforceInterval = $data['enforce_interval'] ?? true;

        $start = Carbon::parse("$date $startTime", $tz);
        $end = $start->copy()->addMinutes($duration);
        $weekday = strtolower($start->englishDayOfWeek);
        $errors = [];

        // 1. Past date.
        if ($start->copy()->startOfDay()->lt(Carbon::today($tz))) {
            return ['appointment_date' => 'The appointment date cannot be in the past.'];
        }

        // 2. Business is open that weekday.
        if (! in_array($weekday, $settings['working_days'] ?? [], true)) {
            $errors['appointment_date'] = 'The business is closed on '.$start->format('l').'.';
        }

        // 3. Within business hours (start and start+duration).
        $bhStart = Carbon::parse("$date ".$settings['business_hours_start'], $tz);
        $bhEnd = Carbon::parse("$date ".$settings['business_hours_end'], $tz);
        if ($start->lt($bhStart) || $end->gt($bhEnd)) {
            $errors['start_time'] = 'The appointment must fall within business hours ('
                .$this->hm($settings['business_hours_start']).'–'.$this->hm($settings['business_hours_end']).').';
        }

        // 4. Start aligns to the booking interval (strict for public, advisory for admin).
        if ($enforceInterval) {
            $interval = (int) ($settings['appointment_interval'] ?? 30);
            if ($interval > 0 && $bhStart->diffInMinutes($start, false) % $interval !== 0) {
                $errors['start_time'] = 'Please choose a time on a '.$interval.'-minute interval.';
            }
        }

        // 5. Staff availability (only when assigned).
        if ($staffId) {
            $errors += $this->staffViolations((int) $staffId, $date, $start, $end, $weekday, $tz, $settings);
        }

        // 6. Per-day capacity.
        if ($capacity = $this->capacityViolation($date, $staffId, $settings, $ignore)) {
            $errors['appointment_date'] = $capacity;
        }

        // 7. Overlap — only worth checking once the slot is otherwise valid.
        if ($staffId && ! isset($errors['start_time']) && ! isset($errors['staff_id'])
            && ! $this->isSlotAvailable($date, $startTime, $duration, (int) $staffId, $ignore?->id)) {
            $errors['start_time'] = 'This time overlaps another appointment for the selected staff.';
        }

        return $errors;
    }

    /**
     * Throw a ValidationException if any rule is violated (for non-form callers).
     *
     * @param  array<string, mixed>  $data
     */
    public function assertAvailable(array $data, ?Appointment $ignore = null): void
    {
        $errors = $this->violations($data, $ignore);

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * Open, on-interval start times for a date — the source for the public time picker.
     * Guarantees every offered slot passes isSlotAvailable, so it can never be rejected on submit.
     *
     * @return array<int, string> e.g. ['09:00', '09:30', ...]
     */
    public function availableSlots(string $date, Service $service, ?Staff $staff = null): array
    {
        $settings = Setting::values();
        $tz = $settings['timezone'] ?? config('app.timezone');
        $interval = max(5, (int) ($settings['appointment_interval'] ?? 30));
        $buffer = (int) ($settings['buffer_time'] ?? 0);
        $duration = max(5, (int) $service->duration);
        $max = (int) ($settings['max_appointments_per_day'] ?? 0);

        $carbonDate = Carbon::parse($date, $tz);
        $weekday = strtolower($carbonDate->englishDayOfWeek);

        if (! in_array($weekday, $settings['working_days'] ?? [], true)) {
            return [];
        }
        if ($carbonDate->copy()->startOfDay()->lt(Carbon::today($tz))) {
            return [];
        }

        $bhStart = Carbon::parse("$date ".$settings['business_hours_start'], $tz);
        $bhEnd = Carbon::parse("$date ".$settings['business_hours_end'], $tz);

        $candidates = $staff
            ? ($staff->is_active ? collect([$staff]) : collect())
            : Staff::where('is_active', true)->get();
        $unassignedMode = $candidates->isEmpty() && ! $staff;

        // Preload the day's appointments once, grouped by staff, for in-memory overlap.
        $byStaff = Appointment::query()
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value])
            ->get()
            ->groupBy('staff_id');
        $dayTotal = $byStaff->flatten()->count();

        $slots = [];
        for ($t = $bhStart->copy(); $t->copy()->addMinutes($duration)->lte($bhEnd); $t->addMinutes($interval)) {
            if ($t->isPast()) {
                continue;
            }
            $start = $t->copy();
            $end = $t->copy()->addMinutes($duration);

            if ($unassignedMode) {
                if ($max > 0 && $dayTotal >= $max) {
                    break;
                }
                $slots[] = $t->format('H:i');

                continue;
            }

            foreach ($candidates as $member) {
                if (! $this->staffOpen($member, $date, $start, $end, $weekday, $tz, $settings)) {
                    continue;
                }
                $appts = $byStaff->get($member->id, collect());
                if ($max > 0 && $appts->count() >= $max) {
                    continue;
                }
                if (! $this->collides($appts, $start, $end, $buffer)) {
                    $slots[] = $t->format('H:i');
                    break;
                }
            }
        }

        return array_values(array_unique($slots));
    }

    /**
     * @param  Collection<int, Appointment>  $appointments
     */
    protected function collides(Collection $appointments, Carbon $start, Carbon $end, int $buffer): bool
    {
        return $appointments->contains(function (Appointment $a) use ($start, $end, $buffer) {
            $es = $a->startsAt();
            $ee = $a->endsAt();

            return $es && $ee
                && $start->lt($ee->copy()->addMinutes($buffer))
                && $es->lt($end->copy()->addMinutes($buffer));
        });
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<string, string>
     */
    protected function staffViolations(int $staffId, string $date, Carbon $start, Carbon $end, string $weekday, string $tz, array $settings): array
    {
        $staff = Staff::find($staffId);

        if (! $staff || ! $staff->is_active) {
            return ['staff_id' => 'The selected staff member is not available.'];
        }

        $staffDays = $staff->working_days ?? ($settings['working_days'] ?? []);
        if (! in_array($weekday, $staffDays, true)) {
            return ['staff_id' => $staff->name.' does not work on '.$start->format('l').'.'];
        }

        if ($staff->working_start && $staff->working_end) {
            $ws = Carbon::parse("$date ".$staff->working_start, $tz);
            $we = Carbon::parse("$date ".$staff->working_end, $tz);
            if ($start->lt($ws) || $end->gt($we)) {
                return ['staff_id' => $staff->name.' is only available '
                    .$this->hm($staff->working_start).'–'.$this->hm($staff->working_end).'.'];
            }
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    protected function staffOpen(Staff $staff, string $date, Carbon $start, Carbon $end, string $weekday, string $tz, array $settings): bool
    {
        $staffDays = $staff->working_days ?? ($settings['working_days'] ?? []);
        if (! in_array($weekday, $staffDays, true)) {
            return false;
        }

        if ($staff->working_start && $staff->working_end) {
            $ws = Carbon::parse("$date ".$staff->working_start, $tz);
            $we = Carbon::parse("$date ".$staff->working_end, $tz);
            if ($start->lt($ws) || $end->gt($we)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    protected function capacityViolation(string $date, ?int $staffId, array $settings, ?Appointment $ignore): ?string
    {
        $max = (int) ($settings['max_appointments_per_day'] ?? 0);
        if ($max <= 0) {
            return null;
        }

        $count = Appointment::query()
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value])
            ->when($staffId, fn ($q) => $q->where('staff_id', $staffId))
            ->when($ignore, fn ($q) => $q->where('id', '!=', $ignore->id))
            ->count();

        if ($count < $max) {
            return null;
        }

        return $staffId
            ? 'The selected staff member is fully booked on this day.'
            : 'The maximum number of appointments for this day has been reached.';
    }

    /**
     * Trim a stored 'HH:MM:SS' to 'HH:MM' for display.
     */
    protected function hm(string $time): string
    {
        return substr($time, 0, 5);
    }
}
