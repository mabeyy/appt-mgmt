<?php

namespace App\Http\Controllers;

use App\Http\Requests\StaffRequest;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $staff = Staff::query()
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('is_active', $request->string('status')->toString() === 'active');
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('staff/index', [
            'staff' => $staff,
            'filters' => [
                'search' => $search,
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function store(StaffRequest $request): RedirectResponse
    {
        Staff::create($request->validated());

        return back()->with('success', 'Staff member created successfully.');
    }

    public function update(StaffRequest $request, Staff $staff): RedirectResponse
    {
        $staff->update($request->validated());

        return back()->with('success', 'Staff member updated successfully.');
    }

    public function destroy(Staff $staff): RedirectResponse
    {
        $staff->delete();

        return back()->with('success', 'Staff member deleted successfully.');
    }
}
