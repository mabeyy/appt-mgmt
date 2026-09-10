<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\BookableResource;
use App\Models\ClosedDate;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Scheduling rules for the resource verticals (courts and the generic resource
 * type): a booking reserves a {@see BookableResource} for a slot. The resource
 * is the thing that can't double-book, so overlap is checked per resource —
 * the counterpart to {@see AvailabilityService}, which checks per staff member.
 *
 * All queries are tenant-scoped, so these rules apply within one business.
 */
class ResourceAvailabilityService
{
    /**
     * Whether a resource is free for the given slot.
     */
    public function isSlotAvailable(string $date, string $startTime, int $duration, int $resourceId, ?int $ignoreId = null): bool
    {
        $tz = Setting::get('timezone');
        $buffer = (int) Setting::get('buffer_time', 0);
        $start = Carbon::parse("$date $startTime", $tz);
        $end = $start->copy()->addMinutes($duration);

        $existing = Appointment::query()
            ->where('resource_id', $resourceId)
            ->whereDate('appointment_date', $date)
            ->whereNotIn('status', [AppointmentStatus::Cancelled->value, AppointmentStatus::NoShow->value])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->get();

        return ! $existing->contains(function (Appointment $a) use ($start, $end, $buffer) {
            $es = $a->startsAt();
            $ee = $a->endsAt();

            return $es && $ee
                && $start->lt($ee->copy()->addMinutes($buffer))
                && $es->lt($end->copy()->addMinutes($buffer));
        });
    }

    /**
     * On-interval start times for a date where a resource is free — the source
     * for the public time picker. With a resource given, checks just that one;
     * otherwise a slot is offered when *any* active resource can take it.
     *
     * @return array<int, string> e.g. ['09:00', '10:00', ...]
     */
    public function availableSlots(string $date, int $duration, ?int $resourceId = null): array
    {
        $settings = Setting::values();
        $tz = $settings['timezone'] ?? config('app.timezone');
        $interval = max(5, (int) ($settings['appointment_interval'] ?? 60));
        $duration = max(5, $duration);

        $carbonDate = Carbon::parse($date, $tz);
        $weekday = strtolower($carbonDate->englishDayOfWeek);

        if (! in_array($weekday, $settings['working_days'] ?? [], true)) {
            return [];
        }
        if ($carbonDate->copy()->startOfDay()->lt(Carbon::today($tz))) {
            return [];
        }
        if (ClosedDate::isClosed($date)) {
            return [];
        }

        $bhStart = Carbon::parse("$date ".$settings['business_hours_start'], $tz);
        $bhEnd = Carbon::parse("$date ".$settings['business_hours_end'], $tz);

        $resourceIds = $resourceId !== null
            ? [$resourceId]
            : BookableResource::query()->where('is_active', true)->pluck('id')->all();

        if ($resourceIds === []) {
            return [];
        }

        $slots = [];
        for ($t = $bhStart->copy(); $t->copy()->addMinutes($duration)->lte($bhEnd); $t->addMinutes($interval)) {
            if ($t->isPast()) {
                continue;
            }

            foreach ($resourceIds as $id) {
                if ($this->isSlotAvailable($date, $t->format('H:i'), $duration, $id)) {
                    $slots[] = $t->format('H:i');
                    break;
                }
            }
        }

        return array_values(array_unique($slots));
    }

    /**
     * The first active resource free for a slot — resolves an "any court"
     * booking to a concrete resource.
     */
    public function firstAvailableResource(string $date, string $startTime, int $duration): ?BookableResource
    {
        return BookableResource::query()
            ->where('is_active', true)
            ->ordered()
            ->get()
            ->first(fn (BookableResource $r) => $this->isSlotAvailable($date, $startTime, $duration, $r->id));
    }

    /**
     * Evaluate every rule. Returns a field => message map (empty == valid).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    public function violations(array $data, ?Appointment $ignore = null): array
    {
        $date = $data['appointment_date'] ?? null;
        $startTime = $data['start_time'] ?? null;
        $duration = (int) ($data['duration'] ?? 0);
        $resourceId = $data['resource_id'] ?? null;

        if (! $date || ! $startTime || $duration <= 0) {
            return [];
        }

        $settings = Setting::values();
        $tz = $settings['timezone'] ?? config('app.timezone');
        $start = Carbon::parse("$date $startTime", $tz);
        $end = $start->copy()->addMinutes($duration);
        $weekday = strtolower($start->englishDayOfWeek);
        $errors = [];

        if ($start->copy()->startOfDay()->lt(Carbon::today($tz))) {
            return ['appointment_date' => 'The booking date cannot be in the past.'];
        }

        if (! in_array($weekday, $settings['working_days'] ?? [], true)) {
            $errors['appointment_date'] = 'The business is closed on '.$start->format('l').'.';
        } elseif (ClosedDate::isClosed($date)) {
            $errors['appointment_date'] = 'The business is closed on this date.';
        }

        $bhStart = Carbon::parse("$date ".$settings['business_hours_start'], $tz);
        $bhEnd = Carbon::parse("$date ".$settings['business_hours_end'], $tz);
        if ($start->lt($bhStart) || $end->gt($bhEnd)) {
            $errors['start_time'] = 'The booking must fall within business hours ('
                .substr($settings['business_hours_start'], 0, 5).'–'.substr($settings['business_hours_end'], 0, 5).').';
        }

        if ($resourceId && ! isset($errors['start_time'])
            && ! $this->isSlotAvailable($date, $startTime, $duration, (int) $resourceId, $ignore?->id)) {
            $errors['start_time'] = 'This resource is already booked for that time.';
        }

        return $errors;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function assertAvailable(array $data, ?Appointment $ignore = null): void
    {
        $errors = $this->violations($data, $ignore);

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
