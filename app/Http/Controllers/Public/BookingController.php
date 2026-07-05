<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\PublicBookingRequest;
use App\Mail\BookingConfirmation;
use App\Models\Service;
use App\Models\ServiceGroup;
use App\Models\Setting;
use App\Models\Staff;
use App\Services\AppointmentService;
use App\Services\AvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(
        protected AvailabilityService $availability,
        protected AppointmentService $appointments,
    ) {}

    public function index(): Response
    {
        return Inertia::render('public/booking', [
            'serviceGroups' => $this->serviceGroups(),
            'staff' => Staff::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'position']),
            'business' => [
                'phone' => Setting::get('business_phone'),
                'address' => Setting::get('business_address'),
            ],
        ]);
    }

    public function slots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'staff_id' => ['nullable', 'exists:staff,id'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $staff = isset($validated['staff_id']) ? Staff::find($validated['staff_id']) : null;

        return response()->json([
            'slots' => $this->availability->availableSlots($validated['date'], $service, $staff),
        ]);
    }

    public function store(PublicBookingRequest $request): RedirectResponse
    {
        // AppointmentService::create asserts availability first, so an invalid
        // slot surfaces as a validation error before any customer is created.
        $appointment = $this->appointments->create($request->bookingData());

        if ($appointment->customer->email) {
            Mail::to($appointment->customer->email)->queue(new BookingConfirmation($appointment));
        }

        return redirect()
            ->route('book.confirmation')
            ->with('appointment_number', $appointment->appointment_number);
    }

    public function confirmed(Request $request): Response|RedirectResponse
    {
        $number = $request->session()->get('appointment_number');

        if (! $number) {
            return redirect()->route('book.index');
        }

        return Inertia::render('public/booking-confirmed', [
            'appointmentNumber' => $number,
        ]);
    }

    /**
     * Active services grouped by their service group, plus an "Other" bucket
     * for ungrouped services.
     *
     * @return array<int, array{id: int, name: string, services: array<int, array<string, mixed>>}>
     */
    protected function serviceGroups(): array
    {
        $mapService = fn (Service $s) => [
            'id' => $s->id,
            'name' => $s->name,
            'description' => $s->description,
            'duration' => $s->duration,
            'price' => $s->price,
        ];

        $groups = ServiceGroup::with(['services' => fn ($q) => $q->where('is_active', true)->orderBy('name')])
            ->orderBy('name')
            ->get()
            ->map(fn (ServiceGroup $g) => [
                'id' => $g->id,
                'name' => $g->name,
                'services' => $g->services->map($mapService)->all(),
            ])
            ->filter(fn (array $g) => $g['services'] !== [])
            ->values()
            ->all();

        $ungrouped = Service::whereNull('service_group_id')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        if ($ungrouped->isNotEmpty()) {
            $groups[] = [
                'id' => 0,
                'name' => 'Other',
                'services' => $ungrouped->map($mapService)->all(),
            ];
        }

        return $groups;
    }
}
