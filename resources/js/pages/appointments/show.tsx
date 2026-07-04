import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatCurrency,
    formatDate,
    formatDuration,
    formatTime,
} from '@/lib/format';
import { destroy, edit, index } from '@/routes/appointments';
import { show as showCustomer } from '@/routes/customers';
import type { Appointment } from '@/types';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b py-3 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-right text-sm font-medium">{value}</span>
        </div>
    );
}

export default function AppointmentShow({
    appointment,
}: {
    appointment: Appointment;
}) {
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
                                    onSuccess: () => router.visit(index().url),
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

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Details</CardTitle>
                            <StatusBadge status={appointment.status} />
                        </CardHeader>
                        <CardContent>
                            <Row
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
                            <Row
                                label="Email"
                                value={appointment.customer?.email ?? '—'}
                            />
                            <Row
                                label="Phone"
                                value={appointment.customer?.phone ?? '—'}
                            />
                            <Row
                                label="Service"
                                value={appointment.service?.name ?? '—'}
                            />
                            <Row
                                label="Price"
                                value={
                                    appointment.service
                                        ? formatCurrency(
                                              appointment.service.price,
                                          )
                                        : '—'
                                }
                            />
                            <Row
                                label="Staff"
                                value={appointment.staff?.name ?? 'Unassigned'}
                            />
                            <Row
                                label="Date"
                                value={formatDate(appointment.appointment_date)}
                            />
                            <Row
                                label="Time"
                                value={formatTime(appointment.start_time)}
                            />
                            <Row
                                label="Duration"
                                value={formatDuration(appointment.duration)}
                            />
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
