<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceRequest;
use App\Models\Service;
use App\Models\ServiceGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $sort = $request->string('sort', 'name')->toString();
        $direction = $request->string('direction', 'asc')->toString() === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['name', 'duration', 'price', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $services = Service::query()
            ->with('group:id,name')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('is_active', $request->string('status')->toString() === 'active');
            })
            ->orderBy($sort, $direction)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('services/index', [
            'services' => $services,
            'groups' => ServiceGroup::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'status' => $request->string('status')->toString(),
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    public function store(ServiceRequest $request): RedirectResponse
    {
        Service::create($this->withGroup($request->validated()));

        return back()->with('success', 'Service created successfully.');
    }

    public function update(ServiceRequest $request, Service $service): RedirectResponse
    {
        $service->update($this->withGroup($request->validated()));

        return back()->with('success', 'Service updated successfully.');
    }

    /**
     * Resolve the service group from the submitted data, creating a new
     * group when the admin typed one in, and drop the transient new_group key.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function withGroup(array $data): array
    {
        $name = trim($data['new_group'] ?? '');
        unset($data['new_group']);

        if ($name !== '') {
            $data['service_group_id'] = ServiceGroup::firstOrCreate(['name' => $name])->id;
        }

        return $data;
    }

    public function toggle(Service $service): RedirectResponse
    {
        $service->update(['is_active' => ! $service->is_active]);

        return back()->with('success', 'Service status updated.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        if ($service->appointments()->exists()) {
            return back()->with('error', 'This service has appointments and cannot be deleted. Mark it inactive instead.');
        }

        $service->delete();

        return back()->with('success', 'Service deleted successfully.');
    }
}
