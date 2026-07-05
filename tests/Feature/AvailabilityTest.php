<?php

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Staff;
use App\Services\AvailabilityService;
use App\Services\CalendarService;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

function availability(): AvailabilityService
{
    return app(AvailabilityService::class);
}

function makeService(int $duration = 60): Service
{
    return Service::create(['name' => 'Cut', 'duration' => $duration, 'price' => 10, 'is_active' => true]);
}

function makeStaff(array $overrides = []): Staff
{
    return Staff::create(array_merge([
        'name' => 'Alex',
        'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        'working_start' => '09:00',
        'working_end' => '18:00',
        'is_active' => true,
    ], $overrides));
}

function nextMonday(): string
{
    return today()->next(Carbon::MONDAY)->format('Y-m-d');
}

function makeAppointment(array $overrides = []): Appointment
{
    return Appointment::create(array_merge([
        'customer_id' => Customer::create(['full_name' => 'Sam', 'email' => uniqid().'@example.com'])->id,
        'service_id' => makeService()->id,
        'staff_id' => null,
        'appointment_date' => nextMonday(),
        'start_time' => '10:00',
        'duration' => 60,
        'status' => AppointmentStatus::Confirmed->value,
    ], $overrides));
}

it('rejects an overlapping slot for the same staff', function () {
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'duration' => 60]);

    expect(availability()->isSlotAvailable(nextMonday(), '10:30', 60, $staff->id))->toBeFalse();
});

it('allows an adjacent slot when the buffer is zero', function () {
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'duration' => 60]);

    expect(availability()->isSlotAvailable(nextMonday(), '11:00', 60, $staff->id))->toBeTrue();
});

it('respects the buffer between appointments', function () {
    Setting::setMany(['buffer_time' => 15]);
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'duration' => 60]);

    // 11:00 is now too close (needs 15 min gap); 11:15 is fine.
    expect(availability()->isSlotAvailable(nextMonday(), '11:00', 30, $staff->id))->toBeFalse()
        ->and(availability()->isSlotAvailable(nextMonday(), '11:15', 30, $staff->id))->toBeTrue();
});

it('ignores cancelled appointments when checking overlap', function () {
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'status' => AppointmentStatus::Cancelled->value]);

    expect(availability()->isSlotAvailable(nextMonday(), '10:00', 60, $staff->id))->toBeTrue();
});

it('excludes the appointment being updated from its own overlap check', function () {
    $staff = makeStaff();
    $a = makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'duration' => 60]);

    expect(availability()->isSlotAvailable(nextMonday(), '10:00', 60, $staff->id, $a->id))->toBeTrue();
});

it('treats unassigned bookings as never overlapping', function () {
    makeAppointment(['staff_id' => null, 'start_time' => '10:00', 'duration' => 60]);

    expect(availability()->isSlotAvailable(nextMonday(), '10:00', 60, null))->toBeTrue();
});

it('flags a past date', function () {
    $v = availability()->violations([
        'appointment_date' => today()->subDay()->format('Y-m-d'),
        'start_time' => '10:00', 'duration' => 60, 'staff_id' => null,
    ]);

    expect($v)->toHaveKey('appointment_date');
});

it('flags a closed (non-working) day', function () {
    $sunday = today()->next(Carbon::SUNDAY)->format('Y-m-d');

    $v = availability()->violations([
        'appointment_date' => $sunday, 'start_time' => '10:00', 'duration' => 60, 'staff_id' => null,
    ]);

    expect($v)->toHaveKey('appointment_date');
});

it('flags a time outside business hours', function () {
    $v = availability()->violations([
        'appointment_date' => nextMonday(), 'start_time' => '20:00', 'duration' => 60, 'staff_id' => null,
    ]);

    expect($v)->toHaveKey('start_time');
});

it("flags a time outside a staff member's working hours", function () {
    $staff = makeStaff(['working_start' => '09:00', 'working_end' => '12:00']);

    $v = availability()->violations([
        'appointment_date' => nextMonday(), 'start_time' => '14:00', 'duration' => 60, 'staff_id' => $staff->id,
    ]);

    expect($v)->toHaveKey('staff_id');
});

it('enforces the maximum appointments per day', function () {
    Setting::setMany(['max_appointments_per_day' => 1]);
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '09:00', 'duration' => 30]);

    $v = availability()->violations([
        'appointment_date' => nextMonday(), 'start_time' => '11:00', 'duration' => 30, 'staff_id' => $staff->id,
    ]);

    expect($v)->toHaveKey('appointment_date');
});

it('lists only free, on-interval slots', function () {
    $staff = makeStaff();
    $service = makeService(60);
    makeAppointment(['staff_id' => $staff->id, 'service_id' => $service->id, 'start_time' => '10:00', 'duration' => 60]);

    $slots = availability()->availableSlots(nextMonday(), $service, $staff);

    expect($slots)->toContain('09:00')
        ->and($slots)->not->toContain('10:00')  // taken
        ->and($slots)->not->toContain('10:30')  // overlaps the 10:00–11:00 booking
        ->and($slots)->toContain('11:00');       // free again
});

it('rejects rescheduling onto a taken slot', function () {
    $staff = makeStaff();
    makeAppointment(['staff_id' => $staff->id, 'start_time' => '10:00', 'duration' => 60]);
    $moving = makeAppointment(['staff_id' => $staff->id, 'start_time' => '13:00', 'duration' => 60]);

    app(CalendarService::class)->reschedule($moving, [
        'appointment_date' => nextMonday(),
        'start_time' => '10:00',
    ]);
})->throws(ValidationException::class);
