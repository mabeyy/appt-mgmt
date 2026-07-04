<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('calendar/index', [
            'services' => Service::orderBy('name')->get(['id', 'name']),
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $events = Appointment::query()
            ->with(['customer:id,full_name', 'service:id,name'])
            ->when($request->filled('start'), fn ($q) => $q->whereDate('appointment_date', '>=', $request->date('start')))
            ->when($request->filled('end'), fn ($q) => $q->whereDate('appointment_date', '<=', $request->date('end')))
            ->when($request->filled('service_id'), fn ($q) => $q->where('service_id', $request->integer('service_id')))
            ->when($request->filled('staff_id'), fn ($q) => $q->where('staff_id', $request->integer('staff_id')))
            ->get()
            ->map(function (Appointment $a) {
                return [
                    'id' => (string) $a->id,
                    'title' => ($a->customer?->full_name ?? 'Customer').' · '.($a->service?->name ?? ''),
                    'start' => $a->startsAt()?->toIso8601String(),
                    'end' => $a->endsAt()?->toIso8601String(),
                    'backgroundColor' => $a->status->color(),
                    'borderColor' => $a->status->color(),
                    'extendedProps' => [
                        'status' => $a->status->value,
                        'status_label' => $a->status->label(),
                        'appointment_number' => $a->appointment_number,
                    ],
                ];
            });

        return response()->json($events);
    }

    public function reschedule(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'appointment_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
        ]);

        $appointment->update($validated);

        AdminNotification::record(
            'rescheduled',
            'Appointment rescheduled',
            "{$appointment->appointment_number} — {$appointment->customer->full_name}",
            ['appointment_id' => $appointment->id],
        );

        return back()->with('success', 'Appointment rescheduled.');
    }
}
