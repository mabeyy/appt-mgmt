<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\BookableResource;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use Database\Factories\Concerns\ResolvesBusiness;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    use ResolvesBusiness;

    /**
     * A service appointment (salon/barbershop) by default: a service performed
     * by a provider for a customer.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => $this->resolveBusinessId(),
            'customer_id' => Customer::factory(),
            'service_id' => Service::factory(),
            'staff_id' => Staff::factory(),
            'resource_id' => null,
            'appointment_date' => Carbon::parse(fake()->dateTimeBetween('now', '+30 days'))->toDateString(),
            'start_time' => sprintf('%02d:00', fake()->numberBetween(9, 16)),
            'duration' => fake()->randomElement([30, 45, 60]),
            'status' => AppointmentStatus::Confirmed,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * A resource booking (courts / resource vertical): a resource for a slot,
     * no service or provider.
     */
    public function forResource(?BookableResource $resource = null): static
    {
        return $this->state(fn (): array => [
            'service_id' => null,
            'staff_id' => null,
            'resource_id' => $resource !== null ? $resource->id : BookableResource::factory(),
        ]);
    }

    public function on(Carbon|string $date, string $start, int $duration = 60): static
    {
        $date = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $this->state(fn (): array => [
            'appointment_date' => $date->toDateString(),
            'start_time' => $start,
            'duration' => $duration,
        ]);
    }
}
