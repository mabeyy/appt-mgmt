<?php

namespace Database\Factories;

use App\Models\ProductCategory;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductCategory>
 */
class ProductCategoryFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'name' => fake()->unique()->randomElement(['Hair Care', 'Styling', 'Accessories', 'Skincare']),
        ];
    }
}
