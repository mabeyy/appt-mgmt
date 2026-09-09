<?php

namespace Database\Factories\Concerns;

use App\Models\Business;
use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Gives a factory a sensible default `business_id`: the bound tenant, else the
 * platform's first business (so tenancy-agnostic tests line up with the routes'
 * default business), else a fresh Business.
 */
trait ResolvesBusiness
{
    /**
     * @return int|Factory<Business>
     */
    protected function resolveBusinessId(): int|Factory
    {
        $tenantId = app(TenantContext::class)->id();

        if ($tenantId !== null) {
            return $tenantId;
        }

        $existing = Business::query()->min('id');

        return $existing !== null ? (int) $existing : Business::factory();
    }
}
