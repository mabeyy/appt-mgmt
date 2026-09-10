<?php

use App\Models\Appointment;
use App\Models\BookableResource;
use App\Models\Business;
use App\Models\Service;
use App\Services\DashboardService;
use App\Support\TenantContext;

test('a salon dashboard highlights most-booked services', function () {
    $salon = Business::factory()->salon()->create();
    app(TenantContext::class)->set($salon);

    $service = Service::factory()->create(['name' => 'Haircut']);
    Appointment::factory()->count(2)->create(['service_id' => $service->id, 'resource_id' => null]);

    $dashboard = app(DashboardService::class);

    expect($dashboard->mostBookedLabel())->toBe('Most booked services')
        ->and($dashboard->mostBooked())->toContain(['name' => 'Haircut', 'count' => 2]);
});

test('a courts dashboard highlights most-booked courts', function () {
    $courts = Business::factory()->courts()->create();
    app(TenantContext::class)->set($courts);

    $court = BookableResource::factory()->create(['name' => 'Court 1']);
    Appointment::factory()->forResource($court)->count(3)->create(['service_id' => null, 'staff_id' => null]);

    $dashboard = app(DashboardService::class);

    expect($dashboard->mostBookedLabel())->toBe('Most booked courts')
        ->and($dashboard->mostBooked())->toContain(['name' => 'Court 1', 'count' => 3]);
});
