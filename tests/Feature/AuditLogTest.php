<?php

use App\Models\AuditLog;
use App\Models\Business;
use App\Models\User;
use App\Support\TenantContext;
use Inertia\Testing\AssertableInertia as Assert;

test('creating a tenant is audited', function () {
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)->post(route('platform.tenants.store'), [
        'name' => 'Audited Salon',
        'type' => 'salon',
        'owner_name' => 'Owner',
        'owner_email' => 'owner@audited.test',
        'owner_password' => 'correct-horse-battery',
    ])->assertRedirect();

    $business = Business::query()->where('name', 'Audited Salon')->firstOrFail();
    $log = AuditLog::withoutGlobalScopes()->where('action', 'tenant.created')->firstOrFail();

    expect($log->business_id)->toBe($business->id)
        ->and($log->actor_name)->toBe($platform->name);
});

test('suspending a tenant is audited', function () {
    $business = Business::factory()->create(['is_active' => true]);
    $platform = User::factory()->platformAdmin()->create();

    $this->actingAs($platform)->patch(route('platform.tenants.toggle', $business))->assertRedirect();

    expect(AuditLog::withoutGlobalScopes()->where('action', 'tenant.suspended')->exists())->toBeTrue();
});

test('the audit log is scoped per tenant', function () {
    $a = Business::factory()->create();
    $b = Business::factory()->create();

    app(TenantContext::class)->set($a);
    AuditLog::record('thing.happened');

    app(TenantContext::class)->set($b);
    expect(AuditLog::count())->toBe(0);

    app(TenantContext::class)->set($a);
    expect(AuditLog::count())->toBe(1);
});

test('the platform audit page lists entries', function () {
    $platform = User::factory()->platformAdmin()->create();
    AuditLog::record('demo.action', ['business_id' => Business::factory()->create()->id]);

    $this->actingAs($platform)
        ->get(route('platform.audit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('platform/audit')->has('logs.data'));
});
