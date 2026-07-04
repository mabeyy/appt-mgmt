<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $statusCounts = Appointment::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = [
            'total' => (int) $statusCounts->sum(),
            'today' => Appointment::today()->count(),
            'upcoming' => Appointment::upcoming()->count(),
            'pending' => (int) ($statusCounts[AppointmentStatus::Pending->value] ?? 0),
            'confirmed' => (int) ($statusCounts[AppointmentStatus::Confirmed->value] ?? 0),
            'completed' => (int) ($statusCounts[AppointmentStatus::Completed->value] ?? 0),
            'cancelled' => (int) ($statusCounts[AppointmentStatus::Cancelled->value] ?? 0),
            'no_show' => (int) ($statusCounts[AppointmentStatus::NoShow->value] ?? 0),
        ];

        // Monthly trends — last 12 months (portable, computed in PHP).
        $monthlyTrends = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyTrends[] = [
                'month' => $month->format('M Y'),
                'count' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->count(),
            ];
        }

        $statusDistribution = array_map(fn (array $s) => [
            'status' => $s['label'],
            'value' => (int) ($statusCounts[$s['value']] ?? 0),
            'color' => $s['color'],
        ], AppointmentStatus::options());

        $mostBookedServices = Appointment::query()
            ->selectRaw('service_id, count(*) as total')
            ->with('service:id,name')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->service?->name ?? 'Unknown',
                'count' => (int) $row->total,
            ]);

        return Inertia::render('dashboard', [
            'summary' => $summary,
            'monthlyTrends' => $monthlyTrends,
            'statusDistribution' => $statusDistribution,
            'mostBookedServices' => $mostBookedServices,
            'todaySchedule' => $this->serialize(
                Appointment::today()->with(['customer:id,full_name', 'service:id,name', 'staff:id,name'])
                    ->orderBy('start_time')->get()
            ),
            'upcomingAppointments' => $this->serialize(
                Appointment::upcoming()->with(['customer:id,full_name', 'service:id,name', 'staff:id,name'])
                    ->orderBy('appointment_date')->orderBy('start_time')->limit(6)->get()
            ),
            'recentBookings' => $this->serialize(
                Appointment::with(['customer:id,full_name', 'service:id,name'])
                    ->latest()->limit(6)->get()
            ),
        ]);
    }

    /**
     * @param  Collection<int, Appointment>  $appointments
     * @return array<int, array<string, mixed>>
     */
    protected function serialize($appointments): array
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
