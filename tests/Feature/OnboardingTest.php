<?php

use App\Enums\BusinessType;
use App\Models\Business;
use App\Models\User;

test('the get-started page loads with business types', function () {
    $this->get(route('onboarding.show'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('onboarding')->has('types', 4));
});

test('signing up creates a business and owner then logs in', function () {
    $this->post(route('onboarding.store'), [
        'business_name' => 'Sharp Cuts',
        'business_type' => 'barbershop',
        'name' => 'Sam Owner',
        'email' => 'sam@sharpcuts.test',
        'password' => 'correct-horse-battery',
        'password_confirmation' => 'correct-horse-battery',
    ])->assertRedirect(route('dashboard', absolute: false));

    $business = Business::query()->where('name', 'Sharp Cuts')->firstOrFail();
    expect($business->type)->toBe(BusinessType::Barbershop)
        ->and($business->slug)->toBe('sharp-cuts');

    $owner = User::query()->where('email', 'sam@sharpcuts.test')->firstOrFail();
    expect($owner->isTenant())->toBeTrue()->and($owner->business_id)->toBe($business->id);
    $this->assertAuthenticatedAs($owner);
});

test('a duplicate business name gets a distinct slug', function () {
    Business::factory()->create(['name' => 'Twins', 'slug' => 'twins']);

    $this->post(route('onboarding.store'), [
        'business_name' => 'Twins',
        'business_type' => 'salon',
        'name' => 'Two',
        'email' => 'two@twins.test',
        'password' => 'correct-horse-battery',
        'password_confirmation' => 'correct-horse-battery',
    ])->assertRedirect();

    expect(Business::query()->where('slug', 'twins-2')->exists())->toBeTrue();
});

test('sign-up validates its input', function () {
    $this->post(route('onboarding.store'), [])
        ->assertSessionHasErrors(['business_name', 'business_type', 'name', 'email', 'password']);
});
