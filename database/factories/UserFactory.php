<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state — a business owner (tenant), matching
     * the app's original "any signed-in user runs the business" behaviour.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'role' => UserRole::Tenant,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * A platform administrator — operates across every business.
     */
    public function platformAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::PlatformAdmin,
            'business_id' => null,
        ]);
    }

    /**
     * A staff member with a limited login.
     */
    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Staff,
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
