<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\BookableResourceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A bookable resource for the courts / generic "resource" verticals — a court,
 * room, table, lane, chair… whatever the venue books by the slot. The
 * service-based verticals (salon, barbershop) don't use these; they book a
 * service performed by a staff provider instead.
 *
 * (Named BookableResource rather than Resource to avoid PHP's reserved
 * `resource` pseudo-type, which trips docblock tooling. The table stays
 * `resources`.)
 *
 * @property int $id
 * @property int $business_id
 * @property string $name
 * @property bool $is_active
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'is_active', 'position'])]
class BookableResource extends Model
{
    /** @use HasFactory<BookableResourceFactory> */
    use BelongsToBusiness, HasFactory;

    protected $table = 'resources';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'position' => 'integer',
        ];
    }

    /** @return HasMany<Appointment, $this> */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'resource_id');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('position')->orderBy('id');
    }
}
