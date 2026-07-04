<?php

namespace App\Http\Controllers;

use App\Actions\ResolveCustomer;
use App\Enums\AppointmentStatus;
use App\Http\Requests\AppointmentRequest;
use App\Models\AdminNotification;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
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
            'customers' => Customer::orderBy('full_name')->get(['id', 'full_name', 'email', 'phone']),
            'statuses' => AppointmentStatus::options(),
        ]);
    }

    public function store(AppointmentRequest $request, ResolveCustomer $resolveCustomer): RedirectResponse
    {
        $data = $request->validated();
        $customer = $resolveCustomer->handle($data);

        $appointment = Appointment::create([
            'customer_id' => $customer->id,
            'service_id' => $data['service_id'],
            'staff_id' => $data['staff_id'] ?? null,
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'duration' => $data['duration'],
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
        ]);

        AdminNotification::record(
            'new_appointment',
            'New appointment booked',
            "{$customer->full_name} — {$appointment->appointment_number}",
            ['appointment_id' => $appointment->id],
        );

        return redirect()->route('appointments.index')->with('success', 'Appointment created successfully.');
    }

    public function show(Appointment $appointment): Response
    {
        $appointment->load(['customer', 'service', 'staff']);

        return Inertia::render('appointments/show', [
            'appointment' => $appointment,
        ]);
    }

    public function edit(Appointment $appointment): Response
    {
        $appointment->load(['customer', 'service', 'staff']);

        return Inertia::render('appointments/edit', [
            'appointment' => $appointment,
            'services' => Service::orderBy('name')->get(['id', 'name', 'duration', 'price']),
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
            'customers' => Customer::orderBy('full_name')->get(['id', 'full_name', 'email', 'phone']),
            'statuses' => AppointmentStatus::options(),
        ]);
    }

    public function update(AppointmentRequest $request, Appointment $appointment, ResolveCustomer $resolveCustomer): RedirectResponse
    {
        $data = $request->validated();
        $customer = $resolveCustomer->handle($data);

        $wasRescheduled = $appointment->appointment_date->format('Y-m-d') !== $data['appointment_date']
            || substr((string) $appointment->start_time, 0, 5) !== $data['start_time'];
        $wasCancelled = $appointment->status !== AppointmentStatus::Cancelled
            && $data['status'] === AppointmentStatus::Cancelled->value;

        $appointment->update([
            'customer_id' => $customer->id,
            'service_id' => $data['service_id'],
            'staff_id' => $data['staff_id'] ?? null,
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'duration' => $data['duration'],
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
        ]);

        if ($wasCancelled) {
            $this->notifyAppointment('cancelled', 'Appointment cancelled', $appointment);
        } elseif ($wasRescheduled) {
            $this->notifyAppointment('rescheduled', 'Appointment rescheduled', $appointment);
        }

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

        Appointment::whereIn('id', $validated['ids'])->delete();

        return back()->with('success', count($validated['ids']).' appointment(s) deleted.');
    }

    public function bulkStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'max:100'],
            'ids.*' => ['integer', 'exists:appointments,id'],
            'status' => ['required', new Enum(AppointmentStatus::class)],
        ]);

        Appointment::whereIn('id', $validated['ids'])->update(['status' => $validated['status']]);

        return back()->with('success', count($validated['ids']).' appointment(s) updated.');
    }

    protected function notifyAppointment(string $type, string $title, Appointment $appointment): void
    {
        AdminNotification::record(
            $type,
            $title,
            "{$appointment->appointment_number} — {$appointment->customer->full_name}",
            ['appointment_id' => $appointment->id],
        );
    }
}
