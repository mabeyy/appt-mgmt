<?php

namespace App\Http\Controllers;

use App\Enums\BusinessType;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Self-serve sign-up: create a business, its first owner and log them straight
 * into the control panel.
 */
class OnboardingController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('onboarding', [
            'types' => BusinessType::options(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:120'],
            'business_type' => ['required', Rule::enum(BusinessType::class)],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $business = Business::create([
            'name' => $data['business_name'],
            'slug' => $this->uniqueSlug($data['business_name']),
            'type' => BusinessType::from($data['business_type']),
            'timezone' => config('app.timezone', 'UTC'),
            'is_active' => true,
        ]);

        $owner = new User(['name' => $data['name'], 'email' => $data['email']]);
        $owner->forceFill([
            'business_id' => $business->id,
            'role' => UserRole::Tenant,
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ])->save();

        Auth::login($owner);

        AuditLog::record('tenant.self_registered', [
            'business_id' => $business->id,
            'entity_type' => 'business',
            'entity_id' => $business->id,
            'metadata' => ['name' => $business->name, 'type' => $business->type->value],
        ]);

        return to_route('dashboard');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'business';
        $slug = $base;
        $suffix = 1;

        while (Business::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
