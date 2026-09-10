<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\AppointmentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Appointment extends Model
{
    /** @use HasFactory<AppointmentFactory> */
    use BelongsToBusiness, HasFactory;

    protected $fillable = [
        'appointment_number',
        'customer_id',
        'service_id',
        'staff_id',
        'resource_id',
        'appointment_date',
        'start_time',
        'duration',
        'status',
        'reminder_sent_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'duration' => 'integer',
            'status' => AppointmentStatus::class,
            'reminder_sent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Appointment $appointment) {
            if (empty($appointment->appointment_number)) {
                // Global sequence (scope lifted) so numbers stay unique across
                // every business, matching the global unique index.
                $next = (static::withoutGlobalScopes()->max('id') ?? 0) + 1;
                $appointment->appointment_number = 'APT-'.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Service, $this> */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /** @return BelongsTo<Staff, $this> */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    /**
     * The resource booked, for the courts / resource verticals (null for
     * service appointments).
     *
     * @return BelongsTo<BookableResource, $this>
     */
    public function resource(): BelongsTo
    {
        return $this->belongsTo(BookableResource::class, 'resource_id');
    }

    /**
     * Combined date + start time.
     */
    public function startsAt(): ?Carbon
    {
        if (! $this->appointment_date || ! $this->start_time) {
            return null;
        }

        return Carbon::parse(
            $this->appointment_date->format('Y-m-d').' '.$this->start_time,
            Setting::get('timezone'),
        );
    }

    public function endsAt(): ?Carbon
    {
        return $this->startsAt()?->copy()->addMinutes($this->duration);
    }

    /** @param  Builder<Appointment>  $query */
    public function scopeToday(Builder $query): void
    {
        $query->whereDate('appointment_date', today());
    }

    /** @param  Builder<Appointment>  $query */
    public function scopeUpcoming(Builder $query): void
    {
        $query->whereDate('appointment_date', '>', today());
    }
}
