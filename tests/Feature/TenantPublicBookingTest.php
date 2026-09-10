<?php

use App\Models\Business;
use App\Support\TenantContext;

beforeEach(function () {
    // A salon is the first active business; a courts venue is the second.
    Business::query()->update(['is_active' => false]);
    $this->salon = Business::factory()->salon()->create(['slug' => 'glow-salon', 'is_active' => true]);
    $this->courts = Business::factory()->courts()->create(['slug' => 'downtown-courts', 'is_active' => true]);
});

test('a per-tenant URL renders that tenant regardless of which is first active', function () {
    // /book (no slug) resolves the first active business — the salon.
    $this->get(route('book.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/booking'));

    // /book/downtown-courts binds the courts tenant and renders its flow.
    $this->get(route('tenant.book.index', $this->courts))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/resource-booking')
            ->where('endpoints.resourceStore', fn ($url) => str_contains($url, 'downtown-courts')));
});

test('the per-tenant page passes slug-scoped endpoints', function () {
    $this->get(route('tenant.book.index', $this->salon))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/booking')
            ->where('endpoints.store', fn ($url) => str_contains($url, 'glow-salon')));
});

test('an unknown tenant slug 404s', function () {
    app(TenantContext::class)->forget();
    $this->get('/book/no-such-tenant')->assertNotFound();
});

test('an inactive tenant 404s', function () {
    $this->courts->update(['is_active' => false]);

    $this->get(route('tenant.book.index', $this->courts))->assertNotFound();
});
