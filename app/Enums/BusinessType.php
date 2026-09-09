<?php

namespace App\Enums;

use App\Models\Business;

/**
 * The kind of business a {@see Business} is.
 *
 * The type is data, not a code fork: it drives the terminology the UI shows,
 * which features appear, and how a booking is made. Two shapes exist:
 *
 *  - Service businesses (salon, barbershop) book a *service* (which fixes the
 *    duration) performed by a *provider* (staff) for a customer.
 *  - Resource businesses (courts, and the generic "resource" type) book a
 *    *resource* — a court, room, table, lane… — for a time slot, with no
 *    provider or per-service duration.
 */
enum BusinessType: string
{
    case Salon = 'salon';
    case Barbershop = 'barbershop';
    case Courts = 'courts';
    case Resource = 'resource';

    public function label(): string
    {
        return match ($this) {
            self::Salon => 'Salon',
            self::Barbershop => 'Barbershop',
            self::Courts => 'Courts',
            self::Resource => 'Other (resource booking)',
        };
    }

    /**
     * Whether bookings pick a service (fixing their duration) performed by a
     * provider — salon and barbershop.
     */
    public function usesServices(): bool
    {
        return $this === self::Salon || $this === self::Barbershop;
    }

    /**
     * Whether bookings reserve a resource for a slot — courts and the generic
     * resource type.
     */
    public function usesResources(): bool
    {
        return $this === self::Courts || $this === self::Resource;
    }

    /**
     * The singular noun for the thing booked.
     */
    public function resourceNoun(): string
    {
        return match ($this) {
            self::Salon => 'Stylist',
            self::Barbershop => 'Barber',
            self::Courts => 'Court',
            self::Resource => 'Resource',
        };
    }

    /**
     * The word a customer would use for their booking.
     */
    public function bookingNoun(): string
    {
        return match ($this) {
            self::Salon, self::Barbershop => 'Appointment',
            self::Courts, self::Resource => 'Booking',
        };
    }

    /**
     * Terminology shared with the frontend so React copy relabels per type.
     *
     * @return array<string, string|bool>
     */
    public function terminology(): array
    {
        return [
            'resource' => $this->resourceNoun(),
            'resourcePlural' => str($this->resourceNoun())->plural()->value(),
            'booking' => $this->bookingNoun(),
            'bookingPlural' => str($this->bookingNoun())->plural()->value(),
            'usesServices' => $this->usesServices(),
            'usesResources' => $this->usesResources(),
        ];
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $type): array => ['value' => $type->value, 'label' => $type->label()],
            self::cases(),
        );
    }
}
