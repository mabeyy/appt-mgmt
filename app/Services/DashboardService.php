<?php

namespace App\Services;

use App\Concerns\AggregatesAppointmentStatuses;
use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class DashboardService
{
    use AggregatesAppointmentStatuses;

    /**
     * Summary cards + status distribution — rendered immediately (they share
     * one status-count query). Heavier datasets are deferred by the controller.
     *
     * @return array<string, mixed>
     */
    public function headline(): array
    {
        $statusCounts = $this->statusCounts(Appointment::query());

        return [
            'summary' => [
                'total' => (int) $statusCounts->sum(),
                'today' => Appointment::today()->count(),
                'upcoming' => Appointment::upcoming()->count(),
                'pending' => (int) ($statusCounts[AppointmentStatus::Pending->value] ?? 0),
                'confirmed' => (int) ($statusCounts[AppointmentStatus::Confirmed->value] ?? 0),
                'completed' => (int) ($statusCounts[AppointmentStatus::Completed->value] ?? 0),
                'cancelled' => (int) ($statusCounts[AppointmentStatus::Cancelled->value] ?? 0),
                'no_show' => (int) ($statusCounts[AppointmentStatus::NoShow->value] ?? 0),
            ],
            'statusDistribution' => $this->statusDistribution($statusCounts),
        ];
    }

    /**
     * @return array<int, array{name: string, count: int}>
     */
    public function mostBookedServices(): array
    {
        return Appointment::query()
            ->selectRaw('service_id, count(*) as total')
            ->with('service:id,name')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->service?->name ?? 'Unknown',
                'count' => (int) $row->total,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function todaySchedule(): array
    {
        return $this->serialize(
            Appointment::today()
                ->with(['customer:id,full_name', 'service:id,name', 'staff:id,name'])
                ->orderBy('start_time')
                ->get()
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function upcomingAppointments(): array
    {
        return $this->serialize(
            Appointment::upcoming()
                ->with(['customer:id,full_name', 'service:id,name', 'staff:id,name'])
                ->orderBy('appointment_date')
                ->orderBy('start_time')
                ->limit(6)
                ->get()
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function recentBookings(): array
    {
        return $this->serialize(
            Appointment::with(['customer:id,full_name', 'service:id,name'])
                ->latest()
                ->limit(6)
                ->get()
        );
    }

    /**
     * Appointment counts for each of the last 12 months (computed in PHP
     * so it stays portable across database drivers).
     *
     * @return array<int, array{month: string, count: int}>
     */
    public function monthlyTrends(): array
    {
        $trends = [];

        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $trends[] = [
                'month' => $month->format('M Y'),
                'count' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->count(),
            ];
        }

        return $trends;
    }

    /**
     * @param  Collection<int, Appointment>  $appointments
     * @return array<int, array<string, mixed>>
     */
    protected function serialize(Collection $appointments): array
    {
        return $appointments->map(fn (Appointment $a) => [
            'id' => $a->id,
            'appointment_number' => $a->appointment_number,
            'customer_name' => $a->customer?->full_name,
            'service_name' => $a->service?->name,
            'staff_name' => $a->staff?->name,
            'appointment_date' => $a->appointment_date?->format('Y-m-d'),
            'start_time' => substr((string) $a->start_time, 0, 5),
            'status' => $a->status->value,
            'status_label' => $a->status->label(),
            'status_color' => $a->status->color(),
        ])->all();
    }
}
