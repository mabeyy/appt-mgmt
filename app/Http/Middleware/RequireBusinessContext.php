<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The tenant control panel always operates on one business. A platform admin
 * who hasn't stepped into a business has no business context, so send them to
 * the cross-tenant console instead of rendering a business-less panel.
 */
class RequireBusinessContext
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isPlatformAdmin() && ! $this->tenant->has()) {
            return redirect()->route('platform.dashboard');
        }

        return $next($request);
    }
}
