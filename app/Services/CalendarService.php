<?php

namespace App\Services;

use App\Models\Appointment;

class CalendarService
{
    public function __construct(protected AppointmentNotifier $notifier) {}

    /**
     * Build FullCalendar events for the given filter set.
     *
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function events(array $filters): array
    {
        return Appointment::query()
            ->with(['customer:id,full_name', 'service:id,name'])
            ->when(! empty($filters['start']), fn ($q) => $q->whereDate('appointment_date', '>=', $filters['start']))
            ->when(! empty($filters['end']), fn ($q) => $q->whereDate('appointment_date', '<=', $filters['end']))
            ->when(! empty($filters['service_id']), fn ($q) => $q->where('service_id', $filters['service_id']))
            ->when(! empty($filters['staff_id']), fn ($q) => $q->where('staff_id', $filters['staff_id']))
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => (string) $a->id,
                'title' => ($a->customer?->full_name ?? 'Customer').' · '.($a->service?->name ?? ''),
                'start' => $a->startsAt()?->toIso8601String(),
                'end' => $a->endsAt()?->toIso8601String(),
                'backgroundColor' => $a->status->color(),
                'borderColor' => $a->status->color(),
                'extendedProps' => [
                    'status' => $a->status->value,
                    'status_label' => $a->status->label(),
                    'appointment_number' => $a->appointment_number,
                ],
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function reschedule(Appointment $appointment, array $data): void
    {
        $moved = $appointment->appointment_date->format('Y-m-d') !== $data['appointment_date']
            || substr((string) $appointment->start_time, 0, 5) !== $data['start_time'];

        $appointment->update($data);

        if ($moved) {
            $this->notifier->rescheduled($appointment);
        }
    }
}
