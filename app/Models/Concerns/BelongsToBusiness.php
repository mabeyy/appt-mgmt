<?php

namespace App\Models\Concerns;

use App\Models\Business;
use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Scopes a model to the current business (tenant).
 *
 * A global scope filters queries to the bound business, and new rows are
 * stamped with its id on create. Both stand down when no business is bound
 * (console, queue, seeding). At runtime a tenant is always bound; the create
 * fallback (first business) only matters outside a request.
 *
 * @phpstan-require-extends Model
 */
trait BelongsToBusiness
{
    public static function bootBelongsToBusiness(): void
    {
        static::addGlobalScope('business', function (Builder $builder): void {
            $tenant = app(TenantContext::class);

            if ($tenant->has()) {
                $builder->where($builder->getModel()->getTable().'.business_id', $tenant->id());
            }
        });

        static::creating(function ($model): void {
            if ($model->business_id !== null) {
                return;
            }

            $tenant = app(TenantContext::class);

            $model->business_id = $tenant->id() ?? Business::query()->min('id');
        });
    }

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
