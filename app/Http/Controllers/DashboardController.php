<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(DashboardService $dashboard): Response
    {
        return Inertia::render('dashboard', [
            // Immediate: summary cards + status distribution.
            ...$dashboard->headline(),
            // Deferred: heavier datasets stream in after first paint (skeletons shown).
            'monthlyTrends' => Inertia::defer(fn () => $dashboard->monthlyTrends()),
            'mostBookedServices' => Inertia::defer(fn () => $dashboard->mostBookedServices()),
            'todaySchedule' => Inertia::defer(fn () => $dashboard->todaySchedule(), 'widgets'),
            'upcomingAppointments' => Inertia::defer(fn () => $dashboard->upcomingAppointments(), 'widgets'),
            'recentBookings' => Inertia::defer(fn () => $dashboard->recentBookings(), 'widgets'),
        ]);
    }
}
