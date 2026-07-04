<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $customers = Customer::query()
            ->withCount('appointments')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('full_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search],
        ]);
    }

    public function show(Customer $customer): Response
    {
        $customer->load(['appointments' => function ($q) {
            $q->with(['service:id,name', 'staff:id,name'])->latest('appointment_date');
        }]);

        $appointments = $customer->appointments;

        return Inertia::render('customers/show', [
            'customer' => $customer,
            'stats' => [
                'total' => $appointments->count(),
                'upcoming' => $appointments->filter(fn ($a) => $a->appointment_date >= today() && $a->status !== AppointmentStatus::Cancelled)->count(),
                'cancelled' => $appointments->filter(fn ($a) => $a->status === AppointmentStatus::Cancelled)->count(),
            ],
        ]);
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        Customer::create($request->validated());

        return back()->with('success', 'Customer created successfully.');
    }

    public function update(CustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        if ($customer->appointments()->exists()) {
            return back()->with('error', 'This customer has appointments and cannot be deleted. Their history would be lost.');
        }

        $customer->delete();

        return back()->with('success', 'Customer deleted successfully.');
    }
}
