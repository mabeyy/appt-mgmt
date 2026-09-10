<?php

namespace App\Http\Controllers\Platform;

use App\Enums\BusinessType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Super-admin management of tenants: create, rename/retype, suspend/activate,
 * and step into a tenant to operate its panel for support.
 */
class TenantController extends Controller
{
    /**
     * Create a tenant and its first owner.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::enum(BusinessType::class)],
            'owner_name' => ['required', 'string', 'max:120'],
            'owner_email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'owner_password' => ['required', Password::defaults()],
        ]);

        $business = Business::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'type' => BusinessType::from($data['type']),
            'timezone' => config('app.timezone', 'UTC'),
            'is_active' => true,
        ]);

        $owner = new User(['name' => $data['owner_name'], 'email' => $data['owner_email']]);
        $owner->forceFill([
            'business_id' => $business->id,
            'role' => UserRole::Tenant,
            'password' => Hash::make($data['owner_password']),
            'email_verified_at' => now(),
        ])->save();

        AuditLog::record('tenant.created', [
            'business_id' => $business->id,
            'entity_type' => 'business',
            'entity_id' => $business->id,
            'metadata' => ['name' => $business->name, 'type' => $business->type->value],
        ]);

        return back()->with('success', $business->name.' created.');
    }

    /**
     * Rename a tenant or change its business type.
     */
    public function update(Request $request, Business $business): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::enum(BusinessType::class)],
        ]);

        $business->update([
            'name' => $data['name'],
            'type' => BusinessType::from($data['type']),
        ]);

        return back()->with('success', 'Tenant updated.');
    }

    /**
     * Suspend or reactivate a tenant across the platform.
     */
    public function toggle(Business $business): RedirectResponse
    {
        $business->update(['is_active' => ! $business->is_active]);

        AuditLog::record($business->is_active ? 'tenant.activated' : 'tenant.suspended', [
            'business_id' => $business->id,
            'entity_type' => 'business',
            'entity_id' => $business->id,
            'metadata' => ['name' => $business->name],
        ]);

        return back()->with('success', $business->name.($business->is_active ? ' activated.' : ' suspended.'));
    }

    /**
     * Step into a tenant and operate its control panel. Held in the session.
     */
    public function enter(Request $request, Business $business): RedirectResponse
    {
        $request->session()->put(TenantContext::ACTING_SESSION_KEY, $business->id);

        return to_route('dashboard');
    }

    /**
     * Step back out to the console.
     */
    public function leave(Request $request): RedirectResponse
    {
        $request->session()->forget(TenantContext::ACTING_SESSION_KEY);

        return to_route('platform.dashboard');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'tenant';
        $slug = $base;
        $suffix = 1;

        while (Business::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
