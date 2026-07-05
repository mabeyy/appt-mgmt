<?php

namespace App\Http\Controllers;

use App\Exports\AppointmentsExport;
use App\Models\Appointment;
use App\Models\Setting;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
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

    public function export(Request $request): HttpResponse
    {
        $filters = $this->validateFilters($request);
        [$from, $to] = $this->reports->resolveRange($filters);

        $appointments = $this->reports->appointmentsForExport($from, $to);
        $base = 'appointments_'.$from->format('Ymd').'_'.$to->format('Ymd');

        return match ($filters['format'] ?? 'csv') {
            'excel' => Excel::download(new AppointmentsExport($appointments), "$base.xlsx"),
            'pdf' => Pdf::loadView('reports.export', [
                'appointments' => $appointments,
                'from' => $from,
                'to' => $to,
                'business' => Setting::get('business_name'),
                'summary' => $this->reports->summary($from, $to)['summary'],
            ])->download("$base.pdf"),
            default => $this->csv($appointments, "$base.csv"),
        };
    }

    /**
     * @param  Collection<int, Appointment>  $appointments
     */
    protected function csv(Collection $appointments, string $filename): StreamedResponse
    {
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
     * @return array{period: string|null, date_from: string|null, date_to: string|null, format: string|null}
     */
    protected function validateFilters(Request $request): array
    {
        return $request->validate([
            'period' => ['nullable', 'in:daily,weekly,monthly,yearly,custom'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);
    }
}
