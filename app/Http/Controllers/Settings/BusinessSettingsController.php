<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BusinessSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/business', [
            'settings' => Setting::values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'business_email' => ['nullable', 'email', 'max:255'],
            'business_phone' => ['nullable', 'string', 'max:50'],
            'business_address' => ['nullable', 'string', 'max:1000'],
            'timezone' => ['required', 'string', 'timezone'],
            'business_hours_start' => ['required', 'date_format:H:i'],
            'business_hours_end' => ['required', 'date_format:H:i', 'after:business_hours_start'],
            'working_days' => ['nullable', 'array'],
            'working_days.*' => ['string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'appointment_interval' => ['required', 'integer', 'min:5', 'max:240'],
            'max_appointments_per_day' => ['required', 'integer', 'min:1', 'max:1000'],
            'buffer_time' => ['required', 'integer', 'min:0', 'max:240'],
            'manual_approval' => ['boolean'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('logo')) {
            $validated['business_logo'] = Storage::url($request->file('logo')->store('logos', 'public'));
        }
        unset($validated['logo']);

        Setting::setMany($validated);

        return back()->with('success', 'Settings updated successfully.');
    }
}
