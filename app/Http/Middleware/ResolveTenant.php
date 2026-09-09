<?php

namespace App\Http\Middleware;

use App\Models\Business;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Binds the business (tenant) for the current request, before anything reads
 * per-business data (settings, the Inertia shared props).
 *
 *  - A platform admin operates the console (no business) unless they've stepped
 *    into one, held in the session.
 *  - A signed-in owner/staff user acts for their own business.
 *  - Everyone else acts for the first active business (the single default
 *    install, and the fallback used by the current admin-only app).
 */
class ResolveTenant
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->tenant->set($this->resolveBusiness($request));

        return $next($request);
    }

    private function resolveBusiness(Request $request): ?Business
    {
        $user = $request->user();

        if ($user !== null && $user->isPlatformAdmin()) {
            $actingId = $request->session()->get(TenantContext::ACTING_SESSION_KEY);

            return is_numeric($actingId) ? Business::find((int) $actingId) : null;
        }

        $business = $user?->business;

        return $business ?? Business::query()->active()->orderBy('id')->first();
    }
}
