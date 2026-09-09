<?php

use App\Models\Business;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Setting;
use App\Support\TenantContext;

function actingForBusiness(Business $business): Business
{
    app(TenantContext::class)->set($business);

    return $business;
}

test('the global scope isolates one business from another', function () {
    $a = actingForBusiness(Business::factory()->create());
    Service::factory()->create(['name' => 'Cut A']);
    Customer::factory()->create(['full_name' => 'Client A']);

    expect(Service::count())->toBe(1)
        ->and(Customer::count())->toBe(1);

    actingForBusiness(Business::factory()->create());
    expect(Service::count())->toBe(0)
        ->and(Customer::count())->toBe(0);

    actingForBusiness($a);
    expect(Service::count())->toBe(1);
});

test('new rows are stamped with the active business', function () {
    $business = actingForBusiness(Business::factory()->create());

    $service = Service::create(['name' => 'X', 'duration' => 30, 'price' => 100, 'is_active' => true]);

    expect($service->business_id)->toBe($business->id);
});

test('settings are stored and read per business', function () {
    $a = actingForBusiness(Business::factory()->create());
    Setting::setMany(['business_name' => 'Alpha']);

    $b = actingForBusiness(Business::factory()->create());
    Setting::setMany(['business_name' => 'Beta']);
    expect(Setting::get('business_name'))->toBe('Beta');

    actingForBusiness($a);
    expect(Setting::get('business_name'))->toBe('Alpha');
});
