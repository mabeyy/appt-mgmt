<?php

use App\Http\Controllers\Platform\DashboardController;
use App\Http\Controllers\Platform\TenantController;
use App\Http\Middleware\EnsurePlatformAdmin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Platform (super admin) console
|--------------------------------------------------------------------------
| Cross-tenant administration. Every route requires a platform administrator
| (a user who belongs to no single business).
*/

Route::middleware(['auth', 'verified', EnsurePlatformAdmin::class])
    ->prefix('platform')
    ->name('platform.')
    ->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('audit', [DashboardController::class, 'audit'])->name('audit');

        Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
        Route::put('tenants/{business}', [TenantController::class, 'update'])->name('tenants.update');
        Route::patch('tenants/{business}/toggle', [TenantController::class, 'toggle'])->name('tenants.toggle');
        Route::post('tenants/{business}/enter', [TenantController::class, 'enter'])->name('tenants.enter');
        Route::post('leave', [TenantController::class, 'leave'])->name('leave');
    });
