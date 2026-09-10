<?php

use App\Enums\AppointmentStatus;
use App\Mail\BookingReminder;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Customer;
use App\Support\TenantContext;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Carbon::setTestNow('2026-09-14 09:00:00');
    Mail::fake();
    $this->business = Business::factory()->salon()->create();
    app(TenantContext::class)->set($this->business);
});

afterEach(fn () => Carbon::setTestNow());

test('a reminder is sent for an appointment within the window and marked', function () {
    $customer = Customer::factory()->create(['email' => 'client@example.test']);
    $appt = Appointment::factory()->on('2026-09-14', '15:00')->create([
        'customer_id' => $customer->id,
        'status' => AppointmentStatus::Confirmed,
    ]);

    app(TenantContext::class)->forget(); // command runs unbound (console)

    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Mail::assertQueued(BookingReminder::class, fn ($mail) => $mail->appointment->is($appt));
    expect($appt->fresh()->reminder_sent_at)->not->toBeNull();
});

test('reminders are not sent twice', function () {
    $customer = Customer::factory()->create(['email' => 'client@example.test']);
    Appointment::factory()->on('2026-09-14', '15:00')->create([
        'customer_id' => $customer->id,
        'status' => AppointmentStatus::Confirmed,
        'reminder_sent_at' => now(),
    ]);

    app(TenantContext::class)->forget();
    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Mail::assertNothingQueued();
});

test('no reminder for an appointment outside the window', function () {
    $customer = Customer::factory()->create(['email' => 'client@example.test']);
    Appointment::factory()->on('2026-09-16', '15:00')->create([
        'customer_id' => $customer->id,
        'status' => AppointmentStatus::Confirmed,
    ]);

    app(TenantContext::class)->forget();
    $this->artisan('appointments:send-reminders')->assertSuccessful();

    Mail::assertNothingQueued();
});
