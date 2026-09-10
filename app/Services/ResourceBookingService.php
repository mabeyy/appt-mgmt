<?php

namespace App\Services;

use App\Actions\ResolveCustomer;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\BookableResource;
use Illuminate\Support\Facades\DB;

/**
 * Creates resource bookings (courts / resource verticals) — the counterpart to
 * {@see AppointmentService}, which creates service appointments. A booking here
 * reserves a {@see BookableResource} for a slot, with no service or provider.
 */
class ResourceBookingService
{
    public function __construct(
        protected ResolveCustomer $resolveCustomer,
        protected ResourceAvailabilityService $availability,
        protected AppointmentNotifier $notifier,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Appointment
    {
        // Lock the resource row, then check-and-insert atomically so two
        // concurrent requests can't both pass the overlap check (TOCTOU).
        return DB::transaction(function () use ($data) {
            if (! empty($data['resource_id'])) {
                BookableResource::whereKey($data['resource_id'])->lockForUpdate()->first();
            }

            $this->availability->assertAvailable($data);

            $customer = $this->resolveCustomer->handle($data);

            $appointment = Appointment::create([
                'customer_id' => $customer->id,
                'service_id' => null,
                'staff_id' => null,
                'resource_id' => $data['resource_id'],
                'appointment_date' => $data['appointment_date'],
                'start_time' => $data['start_time'],
                'duration' => $data['duration'],
                'status' => $data['status'] ?? 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            $this->notifier->created($appointment);
            AuditLog::record('booking.created', [
                'entity_type' => 'appointment',
                'entity_id' => $appointment->id,
                'metadata' => ['number' => $appointment->appointment_number],
            ]);

            return $appointment;
        });
    }
}
