<?php

use App\Models\Business;
use App\Models\User;
use App\Support\TenantContext;

beforeEach(function () {
    $this->business = Business::factory()->create();
    app(TenantContext::class)->set($this->business);
});

test('an owner can reach owner-only areas', function () {
    $owner = User::factory()->for($this->business)->create();

    $this->actingAs($owner)->get(route('services.index'))->assertOk();
    $this->actingAs($owner)->get(route('staff.index'))->assertOk();
    $this->actingAs($owner)->get(route('reports.index'))->assertOk();
});

test('a staff member is blocked from owner-only areas', function () {
    $staff = User::factory()->staff()->for($this->business)->create();

    $this->actingAs($staff)->get(route('services.index'))->assertForbidden();
    $this->actingAs($staff)->get(route('staff.index'))->assertForbidden();
    $this->actingAs($staff)->get(route('reports.index'))->assertForbidden();
});

test('a staff member can reach their schedule and clients', function () {
    $staff = User::factory()->staff()->for($this->business)->create();

    $this->actingAs($staff)->get(route('dashboard'))->assertOk();
    $this->actingAs($staff)->get(route('calendar.index'))->assertOk();
    $this->actingAs($staff)->get(route('appointments.index'))->assertOk();
    $this->actingAs($staff)->get(route('customers.index'))->assertOk();
});

test('role helpers reflect the role', function () {
    expect(User::factory()->platformAdmin()->make()->isPlatformAdmin())->toBeTrue()
        ->and(User::factory()->make()->isTenant())->toBeTrue()
        ->and(User::factory()->staff()->make()->isStaff())->toBeTrue()
        ->and(User::factory()->staff()->make()->canManageBusiness())->toBeFalse();
});
