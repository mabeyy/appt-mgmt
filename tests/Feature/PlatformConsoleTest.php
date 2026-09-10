<?php

use App\Enums\BusinessType;
use App\Models\Business;
use App\Models\User;
use App\Support\TenantContext;
use Inertia\Testing\AssertableInertia as Assert;

test('the platform console lists every tenant', function () {
    Business::factory()->create(['name' => 'Alpha Salon']);
    Business::factory()->courts()->create(['name' => 'Beta Courts']);
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)
        ->get(route('platform.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('platform/dashboard')
            ->where('stats.tenants', fn ($n) => $n >= 2)
            ->has('tenants'));
});

test('a tenant owner cannot reach the platform console', function () {
    $business = Business::factory()->create();
    app(TenantContext::class)->set($business);
    $owner = User::factory()->for($business)->create();

    $this->actingAs($owner)->get(route('platform.dashboard'))->assertForbidden();
});

test('a platform admin is redirected from the tenant panel to the console', function () {
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)
        ->get(route('dashboard'))
        ->assertRedirect(route('platform.dashboard', absolute: false));
});

test('the super admin can create a tenant with an owner', function () {
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)->post(route('platform.tenants.store'), [
        'name' => 'Fresh Cuts',
        'type' => 'barbershop',
        'owner_name' => 'Sam Owner',
        'owner_email' => 'sam@freshcuts.test',
        'owner_password' => 'correct-horse-battery',
    ])->assertRedirect();

    $business = Business::query()->where('name', 'Fresh Cuts')->firstOrFail();
    expect($business->type)->toBe(BusinessType::Barbershop);

    $owner = User::query()->where('email', 'sam@freshcuts.test')->firstOrFail();
    expect($owner->isTenant())->toBeTrue()
        ->and($owner->business_id)->toBe($business->id);
});

test('the super admin can suspend a tenant', function () {
    $business = Business::factory()->create(['is_active' => true]);
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)->patch(route('platform.tenants.toggle', $business))->assertRedirect();

    expect($business->fresh()->is_active)->toBeFalse();
});

test('entering a tenant lets the super admin operate its panel', function () {
    $business = Business::factory()->create(['name' => 'Gamma Salon']);
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)
        ->post(route('platform.tenants.enter', $business))
        ->assertRedirect(route('dashboard', absolute: false));

    $this->actingAs($platform)->get(route('dashboard'))->assertOk();

    $this->actingAs($platform)
        ->post(route('platform.leave'))
        ->assertRedirect(route('platform.dashboard', absolute: false));
});
