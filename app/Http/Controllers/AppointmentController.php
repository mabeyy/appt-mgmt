<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\AppointmentRequest;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\Staff;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function __construct(protected AppointmentService $appointments) {}

    public function index(Request $request): Response
    {
        $sort = $request->string('sort', 'appointment_date')->toString();
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['appointment_number', 'appointment_date', 'start_time', 'status', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'appointment_date';
        }

        $appointments = Appointment::query()
            ->with(['customer:id,full_name,email,phone', 'service:id,name', 'staff:id,name'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search')->toString();
                $q->where(function ($q) use ($search) {
                    $q->where('appointment_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($q) => $q->where('full_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('service_id'), fn ($q) => $q->where('service_id', $request->integer('service_id')))
            ->when($request->filled('staff_id'), fn ($q) => $q->where('staff_id', $request->integer('staff_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('appointment_date', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('appointment_date', '<=', $request->date('date_to')))
            ->orderBy($sort, $direction)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('appointments/index', [
            'appointments' => $appointments,
            'filters' => $request->only(['search', 'status', 'service_id', 'staff_id', 'date_from', 'date_to', 'sort', 'direction']),
            'services' => Service::orderBy('name')->get(['id', 'name']),
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
            'statuses' => AppointmentStatus::options(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('appointments/create', [
            'services' => Service::where('is_active', true)->orderBy('name')->get(['id', 'name', 'duration', 'price']),
            'staff' => Staff::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'statuses' => AppointmentStatus::options(),
        ]);
    }

    public function store(AppointmentRequest $request): RedirectResponse
    {
        $this->appointments->create($request->validated());

        return redirect()->route('appointments.index')->with('success', 'Appointment created successfully.');
    }

    public function show(Appointment $appointment): Response
    {
        $appointment->load(['customer', 'service.group', 'staff']);

        return Inertia::render('appointments/show', [
            'appointment' => $appointment,
        ]);
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', new Enum(AppointmentStatus::class)],
        ]);

        $appointment->update(['status' => $validated['status']]);

        // No flash message here — the client fires a richer toast with an
        // "Undo" action so a misclicked status can be reverted.
        return back();
    }

    public function edit(Appointment $appointment): Response
    {
        $appointment->load(['customer', 'service', 'staff']);

        return Inertia::render('appointments/edit', [
            'appointment' => $appointment,
            'services' => Service::orderBy('name')->get(['id', 'name', 'duration', 'price']),
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
            'statuses' => AppointmentStatus::options(),
        ]);
    }

    public function update(AppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $this->appointments->update($appointment, $request->validated());

        return redirect()->route('appointments.index')->with('success', 'Appointment updated successfully.');
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $appointment->delete();

        return back()->with('success', 'Appointment deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['integer', 'exists:appointments,id'],
        ]);

        $this->appointments->bulkDelete($validated['ids']);

        return back()->with('success', count($validated['ids']).' appointment(s) deleted.');
    }

    public function bulkStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['integer', 'exists:appointments,id'],
            'status' => ['required', new Enum(AppointmentStatus::class)],
        ]);

        $this->appointments->bulkUpdateStatus($validated['ids'], $validated['status']);

        return back()->with('success', count($validated['ids']).' appointment(s) updated.');
    }
}
