<?php

namespace App\Services;

use App\Actions\ResolveCustomer;
use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    public function __construct(
        protected ResolveCustomer $resolveCustomer,
        protected AppointmentNotifier $notifier,
        protected AvailabilityService $availability,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Appointment
    {
        // Lock the staff row, then check-and-insert atomically so two
        // concurrent requests can't both pass the overlap check (TOCTOU).
        return DB::transaction(function () use ($data) {
            $this->lockStaff($data['staff_id'] ?? null);

            // Backstop: enforce scheduling rules for every write path, even
            // non-HTTP callers that bypass the FormRequest.
            $this->availability->assertAvailable($data);

            $customer = $this->resolveCustomer->handle($data);

            $appointment = Appointment::create($this->attributes($data, $customer->id));
            $this->notifier->created($appointment);

            return $appointment;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Appointment $appointment, array $data): Appointment
    {
        return DB::transaction(function () use ($appointment, $data) {
            $this->lockStaff($data['staff_id'] ?? null);

            $this->availability->assertAvailable($data, $appointment);

            $customer = $this->resolveCustomer->handle($data);

            $wasRescheduled = $appointment->appointment_date->format('Y-m-d') !== $data['appointment_date']
                || substr((string) $appointment->start_time, 0, 5) !== $data['start_time'];
            $wasCancelled = $appointment->status !== AppointmentStatus::Cancelled
                && $data['status'] === AppointmentStatus::Cancelled->value;

            $appointment->update($this->attributes($data, $customer->id));

            if ($wasCancelled) {
                $this->notifier->cancelled($appointment);
            } elseif ($wasRescheduled) {
                $this->notifier->rescheduled($appointment);
            }

            return $appointment;
        });
    }

    /**
     * Serialize concurrent bookings for the same staff member by taking a row
     * lock inside the surrounding transaction.
     */
    protected function lockStaff(mixed $staffId): void
    {
        if ($staffId) {
            Staff::whereKey($staffId)->lockForUpdate()->first();
        }
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function bulkDelete(array $ids): void
    {
        Appointment::whereIn('id', $ids)->delete();
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function bulkUpdateStatus(array $ids, string $status): void
    {
        Appointment::whereIn('id', $ids)->update(['status' => $status]);
    }

    /**
     * Map validated form data to appointment column values.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function attributes(array $data, int $customerId): array
    {
        return [
            'customer_id' => $customerId,
            'service_id' => $data['service_id'],
            'staff_id' => $data['staff_id'] ?? null,
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'duration' => $data['duration'],
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
        ];
    }
}
