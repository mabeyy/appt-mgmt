<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResourceRequest;
use App\Models\BookableResource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manage the venue's bookable resources (courts, rooms, tables…). Owner-only:
 * staff cannot reach this (see RestrictStaffArea).
 */
class ResourceController extends Controller
{
    public function index(): Response
    {
        $resources = BookableResource::query()
            ->ordered()
            ->withCount('appointments')
            ->get()
            ->map(fn (BookableResource $resource): array => [
                'id' => $resource->id,
                'name' => $resource->name,
                'isActive' => $resource->is_active,
                'position' => $resource->position,
                'bookingsCount' => $resource->appointments_count,
            ]);

        return Inertia::render('resources/index', [
            'resources' => $resources,
            'activeCount' => $resources->where('isActive', true)->count(),
        ]);
    }

    public function store(ResourceRequest $request): RedirectResponse
    {
        BookableResource::create([
            'name' => $request->string('name')->toString(),
            'is_active' => $request->boolean('is_active', true),
            'position' => $request->integer('position') ?: (int) BookableResource::query()->max('position') + 1,
        ]);

        return back()->with('success', 'Resource added.');
    }

    public function update(ResourceRequest $request, BookableResource $resource): RedirectResponse
    {
        $resource->update([
            'name' => $request->string('name')->toString(),
            'is_active' => $request->boolean('is_active', $resource->is_active),
        ]);

        return back()->with('success', 'Resource updated.');
    }

    public function toggle(BookableResource $resource): RedirectResponse
    {
        $resource->update(['is_active' => ! $resource->is_active]);

        return back()->with('success', 'Resource status updated.');
    }

    public function destroy(BookableResource $resource): RedirectResponse
    {
        if ($resource->appointments()->exists()) {
            return back()->with('error', 'This resource has bookings and cannot be deleted. Mark it inactive instead.');
        }

        $resource->delete();

        return back()->with('success', 'Resource deleted.');
    }
}
