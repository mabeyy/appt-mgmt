<?php

namespace App\Http\Controllers\Platform;

use App\Enums\BusinessType;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The super-admin console: every tenant on the platform, with the controls to
 * manage and step into them. A platform admin has no business of their own, so
 * the tenant scope stands down and these queries see every tenant's data.
 */
class DashboardController extends Controller
{
    public function index(): Response
    {
        // Tenant-scoped tables, counted per business with the scope lifted so a
        // lingering "acting as" session can't skew the console.
        $appointmentCounts = $this->countsByBusiness(Appointment::query());
        $customerCounts = $this->countsByBusiness(Customer::query());

        $tenants = Business::query()
            ->withCount('users')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Business $business): array => [
                'id' => $business->id,
                'name' => $business->name,
                'slug' => $business->slug,
                'type' => $business->type->value,
                'typeLabel' => $business->type->label(),
                'isActive' => $business->is_active,
                'usersCount' => $business->users_count,
                'bookingsCount' => (int) ($appointmentCounts[$business->id] ?? 0),
                'customersCount' => (int) ($customerCounts[$business->id] ?? 0),
                'createdAt' => $business->created_at?->toDateString(),
            ]);

        return Inertia::render('platform/dashboard', [
            'tenants' => $tenants,
            'businessTypes' => BusinessType::options(),
            'stats' => [
                'tenants' => $tenants->count(),
                'active' => $tenants->where('isActive', true)->count(),
                'users' => User::query()->count(),
                'bookings' => Appointment::query()->withoutGlobalScopes()->count(),
                'customers' => Customer::query()->withoutGlobalScopes()->count(),
            ],
        ]);
    }

    /**
     * The platform-wide audit trail (every tenant's, newest first).
     */
    public function audit(): Response
    {
        $logs = AuditLog::query()
            ->withoutGlobalScopes()
            ->with(['business:id,name'])
            ->latest('created_at')
            ->paginate(30)
            ->through(fn (AuditLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'actor' => $log->actor_name,
                'business' => $log->business?->name,
                'entity' => $log->entity_type ? $log->entity_type.' #'.$log->entity_id : null,
                'metadata' => $log->metadata,
                'at' => $log->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('platform/audit', ['logs' => $logs]);
    }

    /**
     * Row counts keyed by business_id, with the tenant scope lifted.
     *
     * @param  Builder<covariant \Illuminate\Database\Eloquent\Model>  $query
     * @return Collection<int, int>
     */
    private function countsByBusiness($query): Collection
    {
        return $query
            ->withoutGlobalScopes()
            ->selectRaw('business_id, count(*) as aggregate')
            ->groupBy('business_id')
            ->pluck('aggregate', 'business_id');
    }
}
