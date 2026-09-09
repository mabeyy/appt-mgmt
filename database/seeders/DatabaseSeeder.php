<?php

namespace Database\Seeders;

use App\Enums\BusinessType;
use App\Enums\UserRole;
use App\Models\Business;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Model events are muted here, so business_id is set explicitly — through
     * relationships or forceFill — rather than via the auto-fill hook.
     */
    public function run(): void
    {
        $salon = $this->salon();
        $this->owner($salon, 'test@example.com', 'Test User');
        $this->seedSalonData($salon);

        if (app()->environment('production')) {
            return;
        }

        $courts = $this->courts();
        $this->owner($courts, 'owner@courts.test', 'Courts Owner');
        $this->seedCourtsData($courts);

        $this->platformAdmin();
    }

    private function salon(): Business
    {
        return Business::firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'My Salon', 'type' => BusinessType::Salon, 'timezone' => config('app.timezone', 'UTC'), 'is_active' => true],
        );
    }

    private function courts(): Business
    {
        return Business::firstOrCreate(
            ['slug' => 'downtown-courts'],
            ['name' => 'Downtown Courts', 'type' => BusinessType::Courts, 'timezone' => config('app.timezone', 'UTC'), 'is_active' => true],
        );
    }

    private function owner(Business $business, string $email, string $name): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => bcrypt('password')],
        );

        $user->forceFill([
            'business_id' => $business->id,
            'role' => UserRole::Tenant,
            'email_verified_at' => now(),
        ])->save();

        return $user;
    }

    private function seedSalonData(Business $salon): void
    {
        app(TenantContext::class)->set($salon);

        $hair = $salon->serviceGroups()->firstOrCreate(['name' => 'Hair']);

        foreach ([['Haircut', 45, 350], ['Hair Colour', 120, 1800], ['Beard Trim', 20, 180]] as [$svcName, $duration, $price]) {
            $salon->services()->firstOrCreate(
                ['name' => $svcName],
                ['service_group_id' => $hair->id, 'duration' => $duration, 'price' => $price, 'is_active' => true],
            );
        }

        $provider = $salon->staff()->firstOrCreate(['name' => 'Ava Cruz'], ['position' => 'Senior Stylist', 'is_active' => true]);
        $salon->staff()->firstOrCreate(['name' => 'Ben Reyes'], ['position' => 'Barber', 'is_active' => true]);

        // A staff-role login tied to a provider (demo of the limited view).
        if (! app()->environment('production') && $provider->user_id === null) {
            $staffUser = User::firstOrCreate(
                ['email' => 'ava@salon.test'],
                ['name' => $provider->name, 'password' => bcrypt('password')],
            );
            $staffUser->forceFill([
                'business_id' => $salon->id,
                'role' => UserRole::Staff,
                'email_verified_at' => now(),
            ])->save();
            $provider->forceFill(['user_id' => $staffUser->id])->save();
        }

        app(TenantContext::class)->forget();
    }

    private function seedCourtsData(Business $courts): void
    {
        app(TenantContext::class)->set($courts);

        foreach (['Court 1', 'Court 2', 'Court 3'] as $position => $name) {
            $courts->resources()->firstOrCreate(['name' => $name], ['is_active' => true, 'position' => $position + 1]);
        }

        app(TenantContext::class)->forget();
    }

    private function platformAdmin(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'platform@appt.test'],
            ['name' => 'Platform Admin', 'password' => bcrypt('password')],
        );

        $user->forceFill([
            'business_id' => null,
            'role' => UserRole::PlatformAdmin,
            'email_verified_at' => now(),
        ])->save();
    }
}
