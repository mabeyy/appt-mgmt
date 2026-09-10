<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\PublicBookingRequest;
use App\Mail\BookingConfirmation;
use App\Models\BookableResource;
use App\Models\Business;
use App\Models\Service;
use App\Models\ServiceGroup;
use App\Models\Setting;
use App\Models\Staff;
use App\Services\AppointmentService;
use App\Services\AvailabilityService;
use App\Services\ResourceAvailabilityService;
use App\Services\ResourceBookingService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(
        protected AvailabilityService $availability,
        protected AppointmentService $appointments,
        protected ResourceAvailabilityService $resourceAvailability,
        protected ResourceBookingService $resourceBookings,
        protected TenantContext $tenant,
    ) {}

    public function index(Request $request): Response
    {
        $endpoints = $this->endpoints($request);
        $business = [
            'phone' => Setting::get('business_phone'),
            'address' => Setting::get('business_address'),
        ];

        // Resource verticals (courts, generic) book a resource for a slot; the
        // service verticals (salon, barbershop) book a service with a provider.
        if ($this->tenant->current()?->usesResources()) {
            return Inertia::render('public/resource-booking', [
                'resources' => BookableResource::query()->where('is_active', true)->ordered()
                    ->get(['id', 'name']),
                'business' => $business,
                'endpoints' => $endpoints,
            ]);
        }

        return Inertia::render('public/booking', [
            'serviceGroups' => $this->serviceGroups(),
            'staff' => Staff::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'position']),
            'business' => $business,
            'endpoints' => $endpoints,
        ]);
    }

    /**
     * The endpoint URLs the public page submits to — slug-scoped when reached
     * via a per-tenant URL (/book/{slug}), the shared defaults otherwise. The
     * page uses these so its forms always post to the business it's showing.
     *
     * @return array<string, string>
     */
    protected function endpoints(Request $request): array
    {
        $business = $request->route('business');

        if ($business instanceof Business) {
            return [
                'slots' => route('tenant.book.slots', $business),
                'store' => route('tenant.book.store', $business),
                'resourceSlots' => route('tenant.book.resource-slots', $business),
                'resourceStore' => route('tenant.book.resource-store', $business),
            ];
        }

        return [
            'slots' => route('book.slots'),
            'store' => route('book.store'),
            'resourceSlots' => route('book.resource-slots'),
            'resourceStore' => route('book.resource-store'),
        ];
    }

    /**
     * JSON: open start times for a resource booking on a date.
     */
    public function resourceSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resource_id' => ['nullable', Rule::exists('resources', 'id')->where('is_active', true)],
            'duration' => ['required', 'integer', 'min:15', 'max:600'],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        return response()->json([
            'slots' => $this->resourceAvailability->availableSlots(
                $validated['date'],
                (int) $validated['duration'],
                isset($validated['resource_id']) ? (int) $validated['resource_id'] : null,
            ),
        ]);
    }

    /**
     * Book a resource. "Any resource" resolves to a concrete free one.
     */
    public function resourceStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'resource_id' => ['nullable', Rule::exists('resources', 'id')->where('is_active', true)],
            'appointment_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration' => ['required', 'integer', 'min:15', 'max:600'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($data['resource_id'])) {
            $resource = $this->resourceAvailability->firstAvailableResource(
                $data['appointment_date'],
                $data['start_time'],
                (int) $data['duration'],
            );

            if (! $resource) {
                throw ValidationException::withMessages([
                    'start_time' => 'No resource is available at this time. Please choose another slot.',
                ]);
            }

            $data['resource_id'] = $resource->id;
        }

        $data['status'] = 'pending';
        $appointment = $this->resourceBookings->create($data);

        if ($appointment->customer->email) {
            Mail::to($appointment->customer->email)->queue(new BookingConfirmation($appointment));
        }

        return redirect()
            ->route('book.confirmation')
            ->with('appointment_number', $appointment->appointment_number);
    }

    public function slots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', Rule::exists('services', 'id')->where('is_active', true)],
            'staff_id' => ['nullable', Rule::exists('staff', 'id')->where('is_active', true)],
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
        $data = $request->bookingData();

        // "Any staff" must resolve to a concrete, free staff member so the
        // booking actually reserves a resource (and can't stack on one slot).
        // If the business has no staff at all, leave it unassigned.
        if (empty($data['staff_id']) && Staff::where('is_active', true)->exists()) {
            $staff = $this->availability->firstAvailableStaff(
                $data['appointment_date'],
                $data['start_time'],
                $data['duration'],
            );

            if (! $staff) {
                throw ValidationException::withMessages([
                    'start_time' => 'No staff member is available at this time. Please choose another slot.',
                ]);
            }

            $data['staff_id'] = $staff->id;
        }

        // AppointmentService::create asserts availability first, so an invalid
        // slot surfaces as a validation error before any customer is created.
        $appointment = $this->appointments->create($data);

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
