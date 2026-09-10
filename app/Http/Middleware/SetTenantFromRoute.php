<?php

namespace App\Http\Middleware;

use App\Models\Business;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Binds the tenant from a `{business:slug}` route parameter for a venue's own
 * public booking page (e.g. /book/glow-salon). Overrides the request-wide
 * default from {@see ResolveTenant}, and 404s an inactive venue.
 */
class SetTenantFromRoute
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        // The controller methods are shared with the non-slug routes and don't
        // type-hint Business, so implicit binding doesn't run — resolve the slug
        // here and set the model back on the route for downstream callers.
        $business = $request->route('business');

        if (! $business instanceof Business) {
            $business = Business::query()->where('slug', $business)->first();
        }

        if (! $business instanceof Business || ! $business->is_active) {
            abort(404);
        }

        $request->route()->setParameter('business', $business);
        $this->tenant->set($business);

        return $next($request);
    }
}
