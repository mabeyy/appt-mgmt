<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\ClosedDateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A full-day closure (holiday / special date) for a business.
 *
 * @property int $id
 * @property int $business_id
 * @property Carbon $date
 * @property string|null $reason
 */
class ClosedDate extends Model
{
    /** @use HasFactory<ClosedDateFactory> */
    use BelongsToBusiness, HasFactory;

    protected $fillable = ['date', 'reason'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    /**
     * Whether the current business is closed on the given date.
     */
    public static function isClosed(string $date): bool
    {
        return static::query()->whereDate('date', $date)->exists();
    }
}
