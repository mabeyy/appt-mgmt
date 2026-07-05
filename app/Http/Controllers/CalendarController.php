<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\Staff;
use App\Services\CalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(protected CalendarService $calendar) {}

    public function index(): Response
    {
        return Inertia::render('calendar/index', [
            'services' => Service::orderBy('name')->get(['id', 'name']),
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $filters = $request->only(['start', 'end', 'service_id', 'staff_id']);

        return response()->json($this->calendar->events($filters));
    }

    public function reschedule(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'appointment_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
        ]);

        $this->calendar->reschedule($appointment, $validated);

        return back()->with('success', 'Appointment rescheduled.');
    }
}
