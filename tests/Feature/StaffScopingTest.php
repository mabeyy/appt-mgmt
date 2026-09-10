<?php

use App\Models\Appointment;
use App\Models\Business;
use App\Models\Staff;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow('2026-09-14 08:00:00');
    $this->business = Business::factory()->create();
    app(TenantContext::class)->set($this->business);

    $this->mine = Staff::factory()->create(['name' => 'Mine']);
    $this->theirs = Staff::factory()->create(['name' => 'Theirs']);

    $this->staffUser = User::factory()->staff()->for($this->business)->create();
    $this->mine->forceFill(['user_id' => $this->staffUser->id])->save();

    // Fixed in-range dates so the Sept calendar query is deterministic.
    Appointment::factory()->on('2026-09-15', '10:00')->create(['staff_id' => $this->mine->id]);
    Appointment::factory()->on('2026-09-16', '11:00')->create(['staff_id' => $this->theirs->id]);
});

afterEach(fn () => Carbon::setTestNow());

test('staff only see their own appointments in the list', function () {
    $this->actingAs($this->staffUser)
        ->get(route('appointments.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('appointments.data', 1));
});

test('staff only see their own calendar events', function () {
    $events = $this->actingAs($this->staffUser)
        ->getJson(route('calendar.events', ['start' => '2026-09-01', 'end' => '2026-09-30']))
        ->assertOk()
        ->json();

    // Only the provider's own appointment is returned.
    expect($events)->toHaveCount(1);
});

test('an owner sees all calendar events', function () {
    $owner = User::factory()->for($this->business)->create();

    $events = $this->actingAs($owner)
        ->getJson(route('calendar.events', ['start' => '2026-09-01', 'end' => '2026-09-30']))
        ->assertOk()
        ->json();

    expect($events)->toHaveCount(2);
});

test('an owner sees every appointment', function () {
    $owner = User::factory()->for($this->business)->create();

    $this->actingAs($owner)
        ->get(route('appointments.index'))
        ->assertInertia(fn ($page) => $page->has('appointments.data', 2));
});
