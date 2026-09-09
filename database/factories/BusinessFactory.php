<?php

namespace Database\Factories;

use App\Enums\BusinessType;
use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'type' => BusinessType::Salon,
            'timezone' => 'UTC',
            'is_active' => true,
        ];
    }

    public function type(BusinessType $type): static
    {
        return $this->state(fn (): array => ['type' => $type]);
    }

    public function salon(): static
    {
        return $this->type(BusinessType::Salon);
    }

    public function barbershop(): static
    {
        return $this->type(BusinessType::Barbershop);
    }

    public function courts(): static
    {
        return $this->type(BusinessType::Courts);
    }

    public function resource(): static
    {
        return $this->type(BusinessType::Resource);
    }
}
