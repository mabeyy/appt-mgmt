<?php

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\CustomerRequest;
use App\Models\Appointment;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $onlyDuplicates = $request->boolean('duplicates');

        // Contact values shared by more than one customer — the signal that the
        // same person was recorded more than once (each booking creates a row).
        $dupEmails = Customer::query()
            ->whereNotNull('email')->where('email', '!=', '')
            ->groupBy('email')->havingRaw('COUNT(*) > 1')
            ->pluck('email')->all();
        $dupPhones = Customer::query()
            ->whereNotNull('phone')->where('phone', '!=', '')
            ->groupBy('phone')->havingRaw('COUNT(*) > 1')
            ->pluck('phone')->all();

        $matchesDuplicate = function ($q) use ($dupEmails, $dupPhones) {
            $q->whereIn('email', $dupEmails)->orWhereIn('phone', $dupPhones);
        };

        $customers = Customer::query()
            ->withCount('appointments')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($onlyDuplicates, fn ($q) => $q->where($matchesDuplicate))
            ->orderBy('full_name')
            ->paginate(10)
            ->withQueryString();

        // Flag each row on the current page as a possible duplicate.
        $customers->getCollection()->transform(function (Customer $c) use ($dupEmails, $dupPhones) {
            $c->setAttribute(
                'is_duplicate',
                ($c->email && in_array($c->email, $dupEmails, true))
                    || ($c->phone && in_array($c->phone, $dupPhones, true)),
            );

            return $c;
        });

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
                'duplicates' => $onlyDuplicates,
            ],
            'duplicateCount' => Customer::query()->where($matchesDuplicate)->count(),
            'duplicateGroups' => $this->duplicateGroups($dupEmails, $dupPhones),
        ]);
    }

    /**
     * Cluster duplicate customers into connected groups (linked by a shared
     * email or phone) so each set can be merged as a unit.
     *
     * @param  array<int, string>  $dupEmails
     * @param  array<int, string>  $dupPhones
     * @return array<int, array{members: array<int, mixed>}>
     */
    private function duplicateGroups(array $dupEmails, array $dupPhones): array
    {
        if (empty($dupEmails) && empty($dupPhones)) {
            return [];
        }

        $dupes = Customer::query()
            ->withCount('appointments')
            ->where(function ($q) use ($dupEmails, $dupPhones) {
                $q->whereIn('email', $dupEmails)->orWhereIn('phone', $dupPhones);
            })
            ->orderByDesc('appointments_count')
            ->get();

        // Union-find: connect customers sharing an email or a phone.
        $parent = [];
        foreach ($dupes as $c) {
            $parent[$c->id] = $c->id;
        }

        $find = function ($x) use (&$parent, &$find) {
            return $parent[$x] === $x ? $x : $parent[$x] = $find($parent[$x]);
        };

        $link = [];
        foreach ($dupes as $c) {
            foreach (["e:{$c->email}" => $c->email, "p:{$c->phone}" => $c->phone] as $key => $val) {
                if ($val) {
                    if (isset($link[$key])) {
                        $parent[$find($c->id)] = $find($link[$key]);
                    } else {
                        $link[$key] = $c->id;
                    }
                }
            }
        }

        $groups = [];
        foreach ($dupes as $c) {
            $groups[$find($c->id)][] = $c;
        }

        return collect($groups)
            ->filter(fn ($members) => count($members) > 1)
            ->map(fn ($members) => ['members' => array_values($members)])
            ->values()
            ->all();
    }

    public function merge(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'survivor_id' => ['required', 'exists:customers,id'],
            'duplicate_ids' => ['required', 'array', 'min:1'],
            'duplicate_ids.*' => ['integer', 'distinct', 'different:survivor_id', 'exists:customers,id'],
        ]);

        DB::transaction(function () use ($validated) {
            $survivor = Customer::lockForUpdate()->findOrFail($validated['survivor_id']);

            // Move every duplicate's appointments onto the survivor first, so
            // nothing is orphaned, then backfill any contact detail the
            // survivor is missing before removing the now-empty records.
            Appointment::whereIn('customer_id', $validated['duplicate_ids'])
                ->update(['customer_id' => $survivor->id]);

            $donors = Customer::whereIn('id', $validated['duplicate_ids'])->get();

            foreach (['email', 'phone', 'address'] as $field) {
                if (blank($survivor->{$field})) {
                    $survivor->{$field} = $donors->firstWhere(fn ($d) => filled($d->{$field}))?->{$field};
                }
            }
            $survivor->save();

            Customer::whereIn('id', $validated['duplicate_ids'])->delete();
        });

        return back()->with('success', 'Customers merged successfully.');
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
