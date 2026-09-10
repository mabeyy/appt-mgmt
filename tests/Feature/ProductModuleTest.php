<?php

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use App\Support\TenantContext;

test('a salon owner can manage products', function () {
    $salon = Business::factory()->salon()->create();
    app(TenantContext::class)->set($salon);
    $owner = User::factory()->for($salon)->create();

    $this->actingAs($owner)->get(route('products.index'))->assertOk();

    $this->actingAs($owner)->post(route('products.store'), [
        'name' => 'Shampoo',
        'price' => 250,
        'stock' => 12,
        'low_stock_threshold' => 3,
        'new_category' => 'Hair Care',
        'is_active' => true,
    ])->assertRedirect();

    $product = Product::query()->where('name', 'Shampoo')->firstOrFail();
    expect($product->business_id)->toBe($salon->id)
        ->and($product->category->name)->toBe('Hair Care');
});

test('products are disabled for a courts tenant', function () {
    $courts = Business::factory()->courts()->create();
    app(TenantContext::class)->set($courts);
    $owner = User::factory()->for($courts)->create();

    $this->actingAs($owner)->get(route('products.index'))->assertNotFound();
});

test('staff cannot reach products', function () {
    $salon = Business::factory()->salon()->create();
    app(TenantContext::class)->set($salon);
    $staff = User::factory()->staff()->for($salon)->create();

    $this->actingAs($staff)->get(route('products.index'))->assertForbidden();
});

test('low stock is detected', function () {
    $salon = Business::factory()->salon()->create();
    app(TenantContext::class)->set($salon);

    $low = Product::factory()->create(['stock' => 2, 'low_stock_threshold' => 5]);
    $ok = Product::factory()->create(['stock' => 20, 'low_stock_threshold' => 5]);

    expect($low->isLowStock())->toBeTrue()
        ->and($ok->isLowStock())->toBeFalse();
});
