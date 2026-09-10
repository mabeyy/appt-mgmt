<?php

namespace Database\Factories;

use App\Models\ClosedDate;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<ClosedDate>
 */
class ClosedDateFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'date' => Carbon::parse(fake()->unique()->dateTimeBetween('now', '+60 days'))->toDateString(),
            'reason' => fake()->optional()->randomElement(['Holiday', 'Maintenance', 'Private event']),
        ];
    }

    public function on(Carbon|string $date): static
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $this->state(fn (): array => ['date' => $date->toDateString()]);
    }
}
