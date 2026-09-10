<?php

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\BookableResource;
use App\Models\Business;
use App\Models\Setting;
use App\Models\User;
use App\Services\ResourceAvailabilityService;
use App\Support\TenantContext;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow('2026-09-14 08:00:00'); // Monday
    // A courts tenant, made the sole active business so the public /book flow
    // (which binds the first active business) resolves to it.
    Business::query()->update(['is_active' => false]);
    $this->courts = Business::factory()->courts()->create(['is_active' => true]);
    app(TenantContext::class)->set($this->courts);

    // Open Mon–Sun so the fixed test date is bookable.
    Setting::setMany([
        'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        'business_hours_start' => '08:00',
        'business_hours_end' => '22:00',
        'appointment_interval' => 60,
    ]);

    $this->resource = BookableResource::factory()->create(['name' => 'Court 1']);
});

afterEach(fn () => Carbon::setTestNow());

test('an owner can manage resources', function () {
    $owner = User::factory()->for($this->courts)->create();

    $this->actingAs($owner)->get(route('resources.index'))->assertOk();

    $this->actingAs($owner)->post(route('resources.store'), ['name' => 'Court 2', 'is_active' => true])->assertRedirect();
    expect(BookableResource::where('name', 'Court 2')->exists())->toBeTrue();
});

test('a resource cannot be double-booked', function () {
    $availability = app(ResourceAvailabilityService::class);

    Appointment::factory()->forResource($this->resource)->on('2026-09-15', '10:00', 60)->create();

    expect($availability->isSlotAvailable('2026-09-15', '10:30', 60, $this->resource->id))->toBeFalse()
        ->and($availability->isSlotAvailable('2026-09-15', '11:00', 60, $this->resource->id))->toBeTrue();
});

test('the public page renders the resource flow for a courts tenant', function () {
    $this->get(route('book.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/resource-booking')->has('resources', 1));
});

test('a customer can book a resource end to end', function () {
    $this->post(route('book.resource-store'), [
        'resource_id' => $this->resource->id,
        'appointment_date' => '2026-09-15',
        'start_time' => '14:00',
        'duration' => 60,
        'customer_name' => 'Court Player',
        'customer_phone' => '09171234567',
    ])->assertRedirect(route('book.confirmation', absolute: false));

    $booking = Appointment::withoutGlobalScopes()->firstOrFail();
    expect($booking->business_id)->toBe($this->courts->id)
        ->and($booking->resource_id)->toBe($this->resource->id)
        ->and($booking->service_id)->toBeNull()
        ->and($booking->staff_id)->toBeNull();
});

test('booking a taken resource slot is rejected', function () {
    Appointment::factory()->forResource($this->resource)
        ->on('2026-09-15', '14:00', 60)
        ->create(['status' => AppointmentStatus::Confirmed]);

    $this->post(route('book.resource-store'), [
        'resource_id' => $this->resource->id,
        'appointment_date' => '2026-09-15',
        'start_time' => '14:30',
        'duration' => 60,
        'customer_name' => 'Late Player',
        'customer_phone' => '09170000000',
    ])->assertSessionHasErrors('start_time');
});
