import { Head, router } from '@inertiajs/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
    Bell,
    CalendarClock,
    CalendarPlus,
    CalendarX2,
    CheckCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DataPagination } from '@/components/shared/data-pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { index, read, readAll } from '@/routes/notifications';
import type { AdminNotification, Paginated } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    new_appointment: CalendarPlus,
    cancelled: CalendarX2,
    rescheduled: CalendarClock,
};

function timeAgo(date: string): string {
    try {
        return formatDistanceToNow(parseISO(date), { addSuffix: true });
    } catch {
        return '';
    }
}

export default function NotificationsIndex({
    notifications,
}: {
    notifications: Paginated<AdminNotification>;
}) {
    const hasUnread = notifications.data.some((n) => !n.read_at);

    return (
        <>
            <Head title="Notifications" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Notifications"
                    description="Appointment activity across your business."
                >
                    <Button
                        variant="outline"
                        disabled={!hasUnread}
                        onClick={() =>
                            router.post(
                                readAll().url,
                                {},
                                { preserveScroll: true },
                            )
                        }
                    >
                        <CheckCheck /> Mark all as read
                    </Button>
                </PageHeader>

                <Card className="py-0">
                    {notifications.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Bell}
                                title="No notifications"
                                description="You'll be notified here when appointments are booked, cancelled, or rescheduled."
                            />
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {notifications.data.map((n) => {
                                const Icon = ICONS[n.type] ?? Bell;
                                const unread = !n.read_at;

                                return (
                                    <li
                                        key={n.id}
                                        className={cn(
                                            'flex items-start gap-3 p-4 transition-colors',
                                            unread && 'bg-primary/5',
                                        )}
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <Icon className="size-4.5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {n.message}
                                                </p>
                                            )}
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {timeAgo(n.created_at)}
                                            </p>
                                        </div>
                                        {unread && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.post(
                                                        read(n.id).url,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                Mark read
                                            </Button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <DataPagination
                    links={notifications.links}
                    from={notifications.from}
                    to={notifications.to}
                    total={notifications.total}
                />
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [{ title: 'Notifications', href: index() }],
};
