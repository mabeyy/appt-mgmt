<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps staff-role users inside their part of the tenant panel: the schedule,
 * bookings and clients. Owners are unrestricted. Anything that changes the
 * business — services, staff, resources, reports, settings — is owner-only.
 */
class RestrictStaffArea
{
    /**
     * Route-name prefixes a staff member may reach.
     *
     * @var array<int, string>
     */
    private const STAFF_ALLOWED = [
        'dashboard',
        'calendar.',
        'appointments.',
        'customers.',
        'notifications.',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isStaff() && ! $this->allowedForStaff($request)) {
            abort(403, 'Staff accounts cannot access this area.');
        }

        return $next($request);
    }

    private function allowedForStaff(Request $request): bool
    {
        $name = (string) $request->route()?->getName();

        foreach (self::STAFF_ALLOWED as $allowed) {
            if ($name === $allowed || Str::startsWith($name, $allowed)) {
                return true;
            }
        }

        return false;
    }
}
