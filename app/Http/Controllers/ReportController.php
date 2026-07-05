<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reports) {}

    public function index(Request $request): Response
    {
        $filters = $this->validateFilters($request);
        [$from, $to] = $this->reports->resolveRange($filters);

        return Inertia::render('reports/index', [
            'filters' => [
                'period' => $filters['period'] ?? 'monthly',
                'date_from' => $from->format('Y-m-d'),
                'date_to' => $to->format('Y-m-d'),
            ],
            ...$this->reports->summary($from, $to),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->reports->resolveRange($this->validateFilters($request));

        $appointments = $this->reports->appointmentsForExport($from, $to);
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
     * @return array{period: string|null, date_from: string|null, date_to: string|null}
     */
    protected function validateFilters(Request $request): array
    {
        return $request->validate([
            'period' => ['nullable', 'in:daily,weekly,monthly,yearly,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);
    }
}
