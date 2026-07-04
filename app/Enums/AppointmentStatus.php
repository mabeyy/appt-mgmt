<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Confirmed => 'Confirmed',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
            self::NoShow => 'No Show',
        };
    }

    /**
     * Hex color used for calendar events and charts.
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending => '#f59e0b',
            self::Confirmed => '#3b82f6',
            self::Completed => '#22c55e',
            self::Cancelled => '#ef4444',
            self::NoShow => '#6b7280',
        };
    }

    /**
     * @return array<int, array{value: string, label: string, color: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $s) => [
            'value' => $s->value,
            'label' => $s->label(),
            'color' => $s->color(),
        ], self::cases());
    }
}
