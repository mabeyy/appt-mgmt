<?php

namespace App\Http\Controllers;

use App\Models\ClosedDate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Manage full-day closures (holidays / special dates) for the business.
 * Owner-only (staff can't reach the settings area).
 */
class ClosedDateController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'reason' => ['nullable', 'string', 'max:120'],
        ]);

        ClosedDate::firstOrCreate(
            ['date' => $data['date']],
            ['reason' => $data['reason'] ?? null],
        );

        return back()->with('success', 'Closed date added.');
    }

    public function destroy(ClosedDate $closedDate): RedirectResponse
    {
        $closedDate->delete();

        return back()->with('success', 'Closed date removed.');
    }
}
