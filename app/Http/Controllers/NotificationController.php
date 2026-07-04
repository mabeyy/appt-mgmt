<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('notifications/index', [
            'notifications' => AdminNotification::latest()->paginate(20),
        ]);
    }

    public function markRead(AdminNotification $notification): RedirectResponse
    {
        $notification->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        AdminNotification::unread()->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }
}
