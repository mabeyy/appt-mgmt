<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ClosedDateController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Public\BookingController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\StaffController;
use App\Http\Middleware\RequireBusinessContext;
use App\Http\Middleware\RestrictStaffArea;
use App\Http\Middleware\SetTenantFromRoute;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Self-serve business sign-up.
Route::get('get-started', [OnboardingController::class, 'show'])->name('onboarding.show');
Route::post('get-started', [OnboardingController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('onboarding.store');

// Public, guest-facing self-service booking.
Route::get('book', [BookingController::class, 'index'])->name('book.index');
Route::get('book/slots', [BookingController::class, 'slots'])->middleware('throttle:60,1')->name('book.slots');
Route::post('book', [BookingController::class, 'store'])->middleware('throttle:public-booking')->name('book.store');
// Resource verticals (courts / generic) use their own slot + store endpoints.
Route::get('book/resource-slots', [BookingController::class, 'resourceSlots'])->middleware('throttle:60,1')->name('book.resource-slots');
Route::post('book/resource', [BookingController::class, 'resourceStore'])->middleware('throttle:public-booking')->name('book.resource-store');
Route::get('book/confirmed', [BookingController::class, 'confirmed'])->name('book.confirmation');

// Per-tenant public booking page, keyed by slug (e.g. /book/glow-salon). The
// tenant is bound from the slug; the same controller renders the right flow for
// its type. Literal book/* routes above are matched first, so they never clash.
Route::middleware(SetTenantFromRoute::class)->prefix('book/{business:slug}')->name('tenant.book.')->group(function () {
    Route::get('/', [BookingController::class, 'index'])->name('index');
    Route::get('slots', [BookingController::class, 'slots'])->middleware('throttle:60,1')->name('slots');
    Route::post('/', [BookingController::class, 'store'])->middleware('throttle:public-booking')->name('store');
    Route::get('resource-slots', [BookingController::class, 'resourceSlots'])->middleware('throttle:60,1')->name('resource-slots');
    Route::post('resource', [BookingController::class, 'resourceStore'])->middleware('throttle:public-booking')->name('resource-store');
});

Route::middleware(['auth', 'verified', RequireBusinessContext::class, RestrictStaffArea::class])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Appointments
    Route::post('appointments/bulk-destroy', [AppointmentController::class, 'bulkDestroy'])->name('appointments.bulk-destroy');
    Route::post('appointments/bulk-status', [AppointmentController::class, 'bulkStatus'])->name('appointments.bulk-status');
    Route::patch('appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('appointments.status');
    Route::resource('appointments', AppointmentController::class);

    // Calendar
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('calendar/events', [CalendarController::class, 'events'])->name('calendar.events');
    Route::patch('calendar/{appointment}/reschedule', [CalendarController::class, 'reschedule'])->name('calendar.reschedule');

    // Services / Staff / Customers
    Route::patch('services/{service}/toggle', [ServiceController::class, 'toggle'])->name('services.toggle');
    Route::resource('services', ServiceController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::patch('staff/{staff}/toggle', [StaffController::class, 'toggle'])->name('staff.toggle');
    Route::resource('staff', StaffController::class)->only(['index', 'store', 'update', 'destroy'])->parameters(['staff' => 'staff']);
    // Resources (courts / generic) — owner-only, for resource verticals.
    Route::patch('resources/{resource}/toggle', [ResourceController::class, 'toggle'])->name('resources.toggle');
    Route::resource('resources', ResourceController::class)->only(['index', 'store', 'update', 'destroy']);
    // Products — owner-only, for service verticals (salon/barbershop).
    Route::patch('products/{product}/toggle', [ProductController::class, 'toggle'])->name('products.toggle');
    Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('customers/merge', [CustomerController::class, 'merge'])->name('customers.merge');
    Route::resource('customers', CustomerController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    // Closed dates / holidays (owner-only business config)
    Route::post('closed-dates', [ClosedDateController::class, 'store'])->name('closed-dates.store');
    Route::delete('closed-dates/{closedDate}', [ClosedDateController::class, 'destroy'])->name('closed-dates.destroy');

    // Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
});

require __DIR__.'/settings.php';
require __DIR__.'/platform.php';
