<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\Appointment;

class AppointmentNotifier
{
    public function created(Appointment $appointment): void
    {
        AdminNotification::record(
            'new_appointment',
            'New appointment booked',
            "{$appointment->customer->full_name} — {$appointment->appointment_number}",
            ['appointment_id' => $appointment->id],
        );
    }

    public function rescheduled(Appointment $appointment): void
    {
        $this->record('rescheduled', 'Appointment rescheduled', $appointment);
    }

    public function cancelled(Appointment $appointment): void
    {
        $this->record('cancelled', 'Appointment cancelled', $appointment);
    }

    protected function record(string $type, string $title, Appointment $appointment): void
    {
        AdminNotification::record(
            $type,
            $title,
            "{$appointment->appointment_number} — {$appointment->customer->full_name}",
            ['appointment_id' => $appointment->id],
        );
    }
}
