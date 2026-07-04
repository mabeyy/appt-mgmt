<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        [$from, $to] = $this->resolveRange($request);

        $base = Appointment::query()
            ->whereDate('appointment_date', '>=', $from)
            ->whereDate('appointment_date', '<=', $to);

        $statusCounts = (clone $base)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = [
            'total' => (int) $statusCounts->sum(),
            'completed' => (int) ($statusCounts[AppointmentStatus::Completed->value] ?? 0),
            'cancelled' => (int) ($statusCounts[AppointmentStatus::Cancelled->value] ?? 0),
            'pending' => (int) ($statusCounts[AppointmentStatus::Pending->value] ?? 0),
            'no_show' => (int) ($statusCounts[AppointmentStatus::NoShow->value] ?? 0),
        ];

        $statusDistribution = array_map(fn (array $s) => [
            'status' => $s['label'],
            'value' => (int) ($statusCounts[$s['value']] ?? 0),
            'color' => $s['color'],
        ], AppointmentStatus::options());

        $mostRequested = (clone $base)
            ->selectRaw('service_id, count(*) as total')
            ->with('service:id,name,price')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->service?->name ?? 'Unknown',
                'count' => (int) $r->total,
            ]);

        $staffPerformance = (clone $base)
            ->whereNotNull('staff_id')
            ->selectRaw('staff_id, count(*) as total, sum(case when status = ? then 1 else 0 end) as completed', [AppointmentStatus::Completed->value])
            ->with('staff:id,name')
            ->groupBy('staff_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->staff?->name ?? 'Unassigned',
                'total' => (int) $r->total,
                'completed' => (int) $r->completed,
            ]);

        return Inertia::render('reports/index', [
            'filters' => [
                'period' => $request->string('period', 'monthly')->toString(),
                'date_from' => $from->format('Y-m-d'),
                'date_to' => $to->format('Y-m-d'),
            ],
            'summary' => $summary,
            'statusDistribution' => $statusDistribution,
            'mostRequested' => $mostRequested,
            'staffPerformance' => $staffPerformance,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->resolveRange($request);

        $appointments = Appointment::query()
            ->with(['customer:id,full_name,email,phone', 'service:id,name', 'staff:id,name'])
            ->whereDate('appointment_date', '>=', $from)
            ->whereDate('appointment_date', '<=', $to)
            ->orderBy('appointment_date')
            ->get();

        $filename = 'appointments_'.$from->format('Ymd').'_'.$to->format('Ymd').'.csv';

        return response()->streamDownload(function () use ($appointments) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Appointment #', 'Customer', 'Email', 'Phone', 'Service', 'Staff', 'Date', 'Time', 'Duration (min)', 'Status']);
            foreach ($appointments as $a) {
                fputcsv($out, [
                    $a->appointment_number,
                    $a->customer?->full_name,
                    $a->customer?->email,
                    $a->customer?->phone,
                    $a->service?->name,
                    $a->staff?->name ?? '—',
                    $a->appointment_date?->format('Y-m-d'),
                    substr((string) $a->start_time, 0, 5),
                    $a->duration,
                    $a->status->label(),
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function resolveRange(Request $request): array
    {
        $validated = $request->validate([
            'period' => ['nullable', 'in:daily,weekly,monthly,yearly,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $period = $validated['period'] ?? 'monthly';

        return match ($period) {
            'daily' => [today(), today()],
            'weekly' => [today()->startOfWeek(), today()->endOfWeek()],
            'yearly' => [today()->startOfYear(), today()->endOfYear()],
            'custom' => [
                isset($validated['date_from']) ? Carbon::parse($validated['date_from']) : today()->startOfMonth(),
                isset($validated['date_to']) ? Carbon::parse($validated['date_to']) : today()->endOfMonth(),
            ],
            default => [today()->startOfMonth(), today()->endOfMonth()],
        };
    }
}
