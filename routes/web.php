<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Appointments
    Route::post('appointments/bulk-destroy', [AppointmentController::class, 'bulkDestroy'])->name('appointments.bulk-destroy');
    Route::post('appointments/bulk-status', [AppointmentController::class, 'bulkStatus'])->name('appointments.bulk-status');
    Route::resource('appointments', AppointmentController::class);

    // Calendar
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('calendar/events', [CalendarController::class, 'events'])->name('calendar.events');
    Route::patch('calendar/{appointment}/reschedule', [CalendarController::class, 'reschedule'])->name('calendar.reschedule');

    // Services / Staff / Customers
    Route::resource('services', ServiceController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('staff', StaffController::class)->only(['index', 'store', 'update', 'destroy'])->parameters(['staff' => 'staff']);
    Route::resource('customers', CustomerController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
});

require __DIR__.'/settings.php';
