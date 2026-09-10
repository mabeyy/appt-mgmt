<?php

use App\Models\Business;
use App\Models\ClosedDate;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Staff;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Support\TenantContext;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow('2026-09-14 08:00:00'); // Monday
    $this->business = Business::factory()->salon()->create();
    app(TenantContext::class)->set($this->business);
    Setting::setMany([
        'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        'business_hours_start' => '08:00',
        'business_hours_end' => '20:00',
        'appointment_interval' => 30,
    ]);
});

afterEach(fn () => Carbon::setTestNow());

test('no slots are offered on a closed date', function () {
    $service = Service::factory()->duration(30)->create();
    Staff::factory()->create();

    $availability = app(AvailabilityService::class);

    expect($availability->availableSlots('2026-09-15', $service))->not->toBeEmpty();

    ClosedDate::factory()->on('2026-09-15')->create(['reason' => 'Holiday']);

    expect($availability->availableSlots('2026-09-15', $service))->toBe([]);
});

test('booking on a closed date is rejected', function () {
    $service = Service::factory()->duration(30)->create();
    $staff = Staff::factory()->create();
    ClosedDate::factory()->on('2026-09-15')->create();

    $errors = app(AvailabilityService::class)->violations([
        'appointment_date' => '2026-09-15',
        'start_time' => '10:00',
        'duration' => 30,
        'staff_id' => $staff->id,
    ]);

    expect($errors)->toHaveKey('appointment_date');
});

test('an owner can add and remove a closed date', function () {
    $owner = User::factory()->for($this->business)->create();

    $this->actingAs($owner)->post(route('closed-dates.store'), [
        'date' => '2026-12-25',
        'reason' => 'Christmas',
    ])->assertRedirect();

    $closed = ClosedDate::query()->firstOrFail();
    expect($closed->reason)->toBe('Christmas');

    $this->actingAs($owner)->delete(route('closed-dates.destroy', $closed))->assertRedirect();
    expect(ClosedDate::count())->toBe(0);
});

test('staff cannot manage closed dates', function () {
    $staff = User::factory()->staff()->for($this->business)->create();

    $this->actingAs($staff)->post(route('closed-dates.store'), ['date' => '2026-12-25'])->assertForbidden();
});
