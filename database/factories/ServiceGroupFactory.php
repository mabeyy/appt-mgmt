<?php

namespace Database\Factories;

use App\Models\ServiceGroup;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServiceGroup>
 */
class ServiceGroupFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'name' => fake()->unique()->randomElement(['Hair', 'Colour', 'Beard', 'Styling', 'Treatments']),
        ];
    }
}
