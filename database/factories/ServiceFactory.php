<?php

namespace Database\Factories;

use App\Models\Service;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'service_group_id' => null,
            'name' => fake()->unique()->randomElement([
                'Haircut', 'Beard Trim', 'Hair Colour', 'Blow Dry', 'Shave', 'Kids Cut',
            ]),
            'description' => fake()->optional()->sentence(),
            'duration' => fake()->randomElement([15, 30, 45, 60, 90]),
            'price' => fake()->randomFloat(2, 100, 1500),
            'is_active' => true,
        ];
    }

    public function duration(int $minutes): static
    {
        return $this->state(fn (): array => ['duration' => $minutes]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
