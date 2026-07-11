import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    CalendarDays,
    Check,
    CircleSlash,
    Mail,
    Pencil,
    Phone,
    RotateCcw,
    Scissors,
    Tag,
    Timer,
    Trash2,
    User,
    UserCog,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    formatCurrency,
    formatDate,
    formatDuration,
    formatTime,
} from '@/lib/format';
import {
    destroy,
    edit,
    index,
    status as statusRoute,
} from '@/routes/appointments';
import { show as showCustomer } from '@/routes/customers';
import type { Appointment, AppointmentStatusValue } from '@/types';

// Add minutes to a "HH:mm[:ss]" clock time and return "HH:mm".
function addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const hh = Math.floor((total % (24 * 60)) / 60);
    const mm = total % 60;

    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<AppointmentStatusValue, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No-show',
};

// Contextual status transitions offered on this page.
const STATUS_ACTIONS: Record<
    AppointmentStatusValue,
    Array<{
        to: AppointmentStatusValue;
        label: string;
        icon: LucideIcon;
        destructive?: boolean;
    }>
> = {
    pending: [
        { to: 'confirmed', label: 'Confirm', icon: Check },
        { to: 'cancelled', label: 'Cancel', icon: X, destructive: true },
    ],
    confirmed: [
        { to: 'completed', label: 'Mark complete', icon: Check },
        { to: 'no_show', label: 'No-show', icon: CircleSlash },
        { to: 'cancelled', label: 'Cancel', icon: X, destructive: true },
    ],
    completed: [{ to: 'pending', label: 'Reopen', icon: RotateCcw }],
    cancelled: [{ to: 'pending', label: 'Reopen', icon: RotateCcw }],
    no_show: [{ to: 'pending', label: 'Reopen', icon: RotateCcw }],
};

function StatTile({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
            </div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
            {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
            </span>
            <span className="w-24 shrink-0 text-sm text-muted-foreground">
                {label}
            </span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
                {title}
            </h3>
            <div>{children}</div>
        </div>
    );
}

export default function AppointmentShow({
    appointment,
}: {
    appointment: Appointment;
}) {
    // Remember the previous status of the most recent change so an in-card
    // "Undo" button can revert a misclick to the exact prior status.
    const [lastChange, setLastChange] = useState<{
        from: AppointmentStatusValue;
        to: AppointmentStatusValue;
    } | null>(null);

    const applyStatus = (
        to: AppointmentStatusValue,
        from: AppointmentStatusValue,
        isUndo = false,
    ) => {
        router.patch(
            statusRoute(appointment.id).url,
            { status: to },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (isUndo) {
                        setLastChange(null);
                        toast.success(`Reverted to ${STATUS_LABELS[to]}`);
                    } else {
                        setLastChange({ from, to });
                        toast.success(`Marked as ${STATUS_LABELS[to]}`);
                    }
                },
            },
        );
    };

    const undoable = lastChange && lastChange.to === appointment.status;

    return (
        <>
            <Head title={appointment.appointment_number} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={index()} />}
                    >
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div className="flex-1">
                        <PageHeader
                            title={appointment.appointment_number}
                            description="Appointment details"
                        >
                            <Button
                                variant="outline"
                                render={<Link href={edit(appointment.id)} />}
                            >
                                <Pencil /> Edit
                            </Button>
                            <ConfirmDialog
                                title="Delete appointment?"
                                description="This appointment will be permanently removed."
                                confirmLabel="Delete"
                                destructive
                                onConfirm={() =>
                                    router.delete(destroy(appointment.id).url, {
                                        onSuccess: () =>
                                            router.visit(index().url),
                                    })
                                }
                                trigger={
                                    <Button variant="outline">
                                        <Trash2 className="text-destructive" />{' '}
                                        Delete
                                    </Button>
                                }
                            />
                        </PageHeader>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                            <CardAction>
                                <StatusBadge status={appointment.status} />
                            </CardAction>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <StatTile
                                    icon={CalendarDays}
                                    label="Schedule"
                                    value={formatDate(
                                        appointment.appointment_date,
                                    )}
                                    sub={`${formatTime(appointment.start_time)} – ${formatTime(
                                        addMinutes(
                                            appointment.start_time,
                                            appointment.duration,
                                        ),
                                    )}`}
                                />
                                <StatTile
                                    icon={Banknote}
                                    label="Price"
                                    value={
                                        appointment.service
                                            ? formatCurrency(
                                                  appointment.service.price,
                                              )
                                            : '—'
                                    }
                                    sub={appointment.service?.name ?? undefined}
                                />
                                <StatTile
                                    icon={Timer}
                                    label="Duration"
                                    value={formatDuration(appointment.duration)}
                                />
                            </div>

                            <Section title="Customer">
                                <InfoRow
                                    icon={User}
                                    label="Customer"
                                    value={
                                        appointment.customer ? (
                                            <Link
                                                href={showCustomer(
                                                    appointment.customer.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {appointment.customer.full_name}
                                            </Link>
                                        ) : (
                                            '—'
                                        )
                                    }
                                />
                                <InfoRow
                                    icon={Mail}
                                    label="Email"
                                    value={appointment.customer?.email ?? '—'}
                                />
                                <InfoRow
                                    icon={Phone}
                                    label="Phone"
                                    value={appointment.customer?.phone ?? '—'}
                                />
                            </Section>

                            <Section title="Service">
                                <InfoRow
                                    icon={Scissors}
                                    label="Service"
                                    value={
                                        appointment.service ? (
                                            <span className="flex items-center gap-2">
                                                {appointment.service.name}
                                                {appointment.service.group && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="gap-1 font-normal text-muted-foreground"
                                                    >
                                                        <Tag className="size-3" />
                                                        {
                                                            appointment.service
                                                                .group.name
                                                        }
                                                    </Badge>
                                                )}
                                            </span>
                                        ) : (
                                            '—'
                                        )
                                    }
                                />
                                <InfoRow
                                    icon={UserCog}
                                    label="Staff"
                                    value={
                                        appointment.staff?.name ?? 'Unassigned'
                                    }
                                />
                            </Section>

                            {(STATUS_ACTIONS[appointment.status].length > 0 ||
                                undoable) && (
                                <div className="space-y-3 border-t pt-4">
                                    {STATUS_ACTIONS[appointment.status].length >
                                        0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="mr-1 text-sm text-muted-foreground">
                                                Change status:
                                            </span>
                                            {STATUS_ACTIONS[
                                                appointment.status
                                            ].map((action) => (
                                                <Button
                                                    key={action.to}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        applyStatus(
                                                            action.to,
                                                            appointment.status,
                                                        )
                                                    }
                                                >
                                                    <action.icon
                                                        className={
                                                            action.destructive
                                                                ? 'text-destructive'
                                                                : undefined
                                                        }
                                                    />
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </div>
                                    )}

                                    {undoable && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <RotateCcw className="size-3.5 shrink-0" />
                                            <span>
                                                Changed from{' '}
                                                {STATUS_LABELS[lastChange.from]}.
                                            </span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0"
                                                onClick={() =>
                                                    applyStatus(
                                                        lastChange.from,
                                                        appointment.status,
                                                        true,
                                                    )
                                                }
                                            >
                                                Undo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {appointment.notes ||
                                    'No notes for this appointment.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AppointmentShow.layout = {
    breadcrumbs: [{ title: 'Appointments', href: index() }],
};
