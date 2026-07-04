import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarCheck2,
    CalendarClock,
    CalendarX2,
    Mail,
    MapPin,
    Pencil,
    Phone,
} from 'lucide-react';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatTime } from '@/lib/format';
import { show as showAppointment } from '@/routes/appointments';
import { index } from '@/routes/customers';
import type { Appointment, Customer } from '@/types';

type Props = {
    customer: Customer & { appointments: Appointment[] };
    stats: { total: number; upcoming: number; cancelled: number };
};

export default function CustomerShow({ customer, stats }: Props) {
    return (
        <>
            <Head title={customer.full_name} />
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
                        title={customer.full_name}
                        description="Customer profile"
                    >
                        <CustomerFormDialog
                            customer={customer}
                            trigger={
                                <Button variant="outline">
                                    <Pencil /> Edit
                                </Button>
                            }
                        />
                    </PageHeader>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <StatCard
                        label="Total Appointments"
                        value={stats.total}
                        icon={CalendarCheck2}
                    />
                    <StatCard
                        label="Upcoming"
                        value={stats.upcoming}
                        icon={CalendarClock}
                        accent="text-indigo-600 dark:text-indigo-400"
                        iconBg="bg-indigo-500/10"
                    />
                    <StatCard
                        label="Cancelled"
                        value={stats.cancelled}
                        icon={CalendarX2}
                        accent="text-red-600 dark:text-red-400"
                        iconBg="bg-red-500/10"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="size-4 text-muted-foreground" />
                            {customer.email ?? '—'}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="size-4 text-muted-foreground" />
                            {customer.phone ?? '—'}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="size-4 text-muted-foreground" />
                            {customer.address ?? '—'}
                        </div>
                    </CardContent>
                </Card>

                <Card className="py-0">
                    <CardHeader className="pt-6">
                        <CardTitle>Appointment History</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        {customer.appointments.length === 0 ? (
                            <div className="p-6">
                                <EmptyState
                                    icon={CalendarCheck2}
                                    title="No appointments"
                                    description="This customer has no appointments yet."
                                />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Appointment</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customer.appointments.map((appt) => (
                                        <TableRow key={appt.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={showAppointment(
                                                        appt.id,
                                                    )}
                                                    className="hover:underline"
                                                >
                                                    {appt.appointment_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {appt.service?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    appt.appointment_date,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(appt.start_time)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={appt.status}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CustomerShow.layout = {
    breadcrumbs: [{ title: 'Customers', href: index() }],
};
