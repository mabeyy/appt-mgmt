<?php

namespace App\Support;

use App\Http\Middleware\ResolveTenant;
use App\Models\Business;
use App\Models\Concerns\BelongsToBusiness;

/**
 * Holds the business (tenant) the current request is acting for.
 *
 * Resolved once per request by {@see ResolveTenant} and
 * read everywhere else through the container singleton. When nothing is bound
 * (console, queue, seeding) tenant scoping stands down so those contexts see
 * every row; see {@see BelongsToBusiness}.
 */
class TenantContext
{
    /**
     * Session key holding the business a platform admin is operating as, if any.
     */
    public const ACTING_SESSION_KEY = 'platform_acting_business_id';

    private ?Business $business = null;

    public function set(?Business $business): void
    {
        $this->business = $business;
    }

    public function current(): ?Business
    {
        return $this->business;
    }

    public function id(): ?int
    {
        return $this->business?->id;
    }

    public function has(): bool
    {
        return $this->business !== null;
    }

    public function forget(): void
    {
        $this->business = null;
    }
}
