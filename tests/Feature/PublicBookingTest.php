<?php

use App\Enums\AppointmentStatus;
use App\Mail\BookingConfirmation;
use App\Models\AdminNotification;
use App\Models\Appointment;
use Illuminate\Support\Facades\Mail;

// Reuses makeService(), makeStaff(), nextMonday() from AvailabilityTest.php
// (Pest loads all Feature test files, so those helpers are available globally).

it('lets a guest view the booking page', function () {
    $this->get(route('book.index'))->assertOk();
});

it('returns available slots as JSON', function () {
    $service = makeService(60);
    $staff = makeStaff();

    $response = $this->getJson(route('book.slots', [
        'service_id' => $service->id,
        'staff_id' => $staff->id,
        'date' => nextMonday(),
    ]));

    $response->assertOk()->assertJsonStructure(['slots']);
    expect($response->json('slots'))->toContain('09:00');
});

it('creates a pending booking and ignores client-supplied status and duration', function () {
    Mail::fake();
    $service = makeService(60);
    $staff = makeStaff();

    $response = $this->post(route('book.store'), [
        'service_id' => $service->id,
        'staff_id' => $staff->id,
        'appointment_date' => nextMonday(),
        'start_time' => '10:00',
        'customer_name' => 'Guest User',
        'customer_email' => 'guest@example.com',
        'customer_phone' => '555-0100',
        'status' => 'confirmed', // must be ignored
        'duration' => 999,       // must be ignored
    ]);

    $response->assertRedirect(route('book.confirmation'));

    $appointment = Appointment::first();
    expect($appointment)->not->toBeNull()
        ->and($appointment->status)->toBe(AppointmentStatus::Pending)
        ->and($appointment->duration)->toBe(60);

    Mail::assertQueued(BookingConfirmation::class);
    expect(AdminNotification::where('type', 'new_appointment')->count())->toBe(1);
});

it('rejects a public booking in the past', function () {
    $service = makeService(60);
    $staff = makeStaff();

    $this->post(route('book.store'), [
        'service_id' => $service->id,
        'staff_id' => $staff->id,
        'appointment_date' => today()->subDay()->format('Y-m-d'),
        'start_time' => '10:00',
        'customer_name' => 'Guest',
        'customer_email' => 'g@example.com',
        'customer_phone' => '555-0100',
    ])->assertSessionHasErrors('appointment_date');

    expect(Appointment::count())->toBe(0);
});

it('rejects a public booking on an already-taken slot', function () {
    $service = makeService(60);
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'duration' => 60]);

    $this->post(route('book.store'), [
        'service_id' => $service->id,
        'staff_id' => $staff->id,
        'appointment_date' => nextMonday(),
        'start_time' => '10:00',
        'customer_name' => 'Guest',
        'customer_email' => 'g@example.com',
        'customer_phone' => '555-0100',
    ])->assertSessionHasErrors('start_time');
});
