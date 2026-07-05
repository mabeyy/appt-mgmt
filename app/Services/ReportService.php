<?php

namespace App\Services;

use App\Concerns\AggregatesAppointmentStatuses;
use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class ReportService
{
    use AggregatesAppointmentStatuses;

    /**
     * Resolve a reporting period into a [from, to] date range.
     *
     * @param  array{period?: string|null, date_from?: string|null, date_to?: string|null}  $filters
     * @return array{0: CarbonInterface, 1: CarbonInterface}
     */
    public function resolveRange(array $filters): array
    {
        return match ($filters['period'] ?? 'monthly') {
            'daily' => [today(), today()],
            'weekly' => [today()->startOfWeek(), today()->endOfWeek()],
            'yearly' => [today()->startOfYear(), today()->endOfYear()],
            'custom' => [
                isset($filters['date_from']) ? Carbon::parse($filters['date_from']) : today()->startOfMonth(),
                isset($filters['date_to']) ? Carbon::parse($filters['date_to']) : today()->endOfMonth(),
            ],
            default => [today()->startOfMonth(), today()->endOfMonth()],
        };
    }

    /**
     * Aggregate report figures for the given range.
     *
     * @return array<string, mixed>
     */
    public function summary(CarbonInterface $from, CarbonInterface $to): array
    {
        $statusCounts = $this->statusCounts($this->base($from, $to));

        return [
            'summary' => [
                'total' => (int) $statusCounts->sum(),
                'completed' => (int) ($statusCounts[AppointmentStatus::Completed->value] ?? 0),
                'cancelled' => (int) ($statusCounts[AppointmentStatus::Cancelled->value] ?? 0),
                'pending' => (int) ($statusCounts[AppointmentStatus::Pending->value] ?? 0),
                'no_show' => (int) ($statusCounts[AppointmentStatus::NoShow->value] ?? 0),
            ],
            'statusDistribution' => $this->statusDistribution($statusCounts),
            'mostRequested' => $this->base($from, $to)
                ->selectRaw('service_id, count(*) as total')
                ->with('service:id,name,price')
                ->groupBy('service_id')
                ->orderByDesc('total')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'name' => $r->service?->name ?? 'Unknown',
                    'count' => (int) $r->total,
                ]),
            'staffPerformance' => $this->base($from, $to)
                ->whereNotNull('staff_id')
                ->selectRaw(
                    'staff_id, count(*) as total, sum(case when status = ? then 1 else 0 end) as completed',
                    [AppointmentStatus::Completed->value]
                )
                ->with('staff:id,name')
                ->groupBy('staff_id')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($r) => [
                    'name' => $r->staff?->name ?? 'Unassigned',
                    'total' => (int) $r->total,
                    'completed' => (int) $r->completed,
                ]),
        ];
    }

    /**
     * Appointments in the range, eager-loaded for CSV export.
     *
     * @return Collection<int, Appointment>
     */
    public function appointmentsForExport(CarbonInterface $from, CarbonInterface $to): Collection
    {
        return $this->base($from, $to)
            ->with(['customer:id,full_name,email,phone', 'service:id,name', 'staff:id,name'])
            ->orderBy('appointment_date')
            ->get();
    }

    /**
     * Base query constrained to the reporting range.
     */
    protected function base(CarbonInterface $from, CarbonInterface $to): Builder
    {
        return Appointment::query()
            ->whereDate('appointment_date', '>=', $from)
            ->whereDate('appointment_date', '<=', $to);
    }
}
