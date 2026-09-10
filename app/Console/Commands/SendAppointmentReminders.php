<?php

namespace App\Console\Commands;

use App\Enums\AppointmentStatus;
use App\Mail\BookingReminder;
use App\Models\Appointment;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Sends a one-time reminder for each upcoming appointment across every tenant.
 *
 * Runs outside a request (no bound tenant), so it queries across all businesses
 * with the scope lifted, then binds each appointment's business while it works
 * so the timezone and mail settings resolve for the right venue.
 */
class SendAppointmentReminders extends Command
{
    protected $signature = 'appointments:send-reminders {--hours=24 : Remind for appointments starting within this many hours}';

    protected $description = 'Send reminders for upcoming appointments that have not been reminded yet';

    public function handle(TenantContext $tenant): int
    {
        $window = (int) $this->option('hours');
        $sent = 0;

        Appointment::query()
            ->withoutGlobalScopes()
            ->whereNull('reminder_sent_at')
            ->whereIn('status', [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value])
            ->whereDate('appointment_date', '>=', today())
            ->whereDate('appointment_date', '<=', today()->addDay())
            ->with(['customer', 'business'])
            ->chunkById(100, function ($appointments) use ($tenant, $window, &$sent): void {
                foreach ($appointments as $appointment) {
                    // Resolve settings (timezone) for the appointment's own venue.
                    $tenant->set($appointment->business);

                    $startsAt = $appointment->startsAt();

                    if (! $startsAt || ! $startsAt->isFuture() || $startsAt->diffInHours(now()) > $window) {
                        continue;
                    }

                    if ($appointment->customer?->email) {
                        Mail::to($appointment->customer->email)->queue(new BookingReminder($appointment));
                        $sent++;
                    }

                    $appointment->forceFill(['reminder_sent_at' => now()])->save();
                }

                $tenant->forget();
            });

        $this->info("Sent {$sent} reminder(s).");

        return self::SUCCESS;
    }
}
