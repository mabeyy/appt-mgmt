<?php

namespace Database\Factories;

use App\Models\Product;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'product_category_id' => null,
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####')),
            'price' => fake()->randomFloat(2, 50, 2000),
            'stock' => fake()->numberBetween(0, 100),
            'low_stock_threshold' => 5,
            'is_active' => true,
        ];
    }
}
