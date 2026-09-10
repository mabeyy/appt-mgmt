<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\Staff;
use App\Models\User;
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

        // Staff only see their own calendar; force the filter to their provider.
        $user = $request->user();
        if ($user instanceof User && $user->isStaff()) {
            // -1 (a non-existent id) rather than 0 so the calendar fails closed
            // for a staff login not yet tied to a provider.
            $filters['staff_id'] = $user->staffProfile()->value('id') ?? -1;
        }

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
