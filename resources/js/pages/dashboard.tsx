import { Head, Link } from '@inertiajs/react';
import {
    CalendarArrowUp,
    CalendarCheck2,
    CalendarClock,
    CalendarDays,
    CalendarPlus,
    CircleCheckBig,
    CircleX,
    FileChartColumn,
    Hourglass,
    UserX,
} from 'lucide-react';
import { AppBarChart, AppLineChart, AppPieChart } from '@/components/charts';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDate, formatTime } from '@/lib/format';
import { dashboard } from '@/routes';
import {
    create as createAppointment,
    show as showAppointment,
} from '@/routes/appointments';
import { index as calendar } from '@/routes/calendar';
import { index as reports } from '@/routes/reports';
import type { AppointmentWidgetItem } from '@/types';

type Summary = {
    total: number;
    today: number;
    upcoming: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    no_show: number;
};

type Props = {
    summary: Summary;
    monthlyTrends: Array<{ month: string; count: number }>;
    statusDistribution: Array<{ status: string; value: number; color: string }>;
    mostBookedServices: Array<{ name: string; count: number }>;
    todaySchedule: AppointmentWidgetItem[];
    upcomingAppointments: AppointmentWidgetItem[];
    recentBookings: AppointmentWidgetItem[];
};

const cards = [
    {
        key: 'total',
        label: 'Total Appointments',
        icon: CalendarDays,
        accent: 'text-primary',
        iconBg: 'bg-primary/10',
    },
    {
        key: 'today',
        label: "Today's Appointments",
        icon: CalendarClock,
        accent: 'text-sky-600 dark:text-sky-400',
        iconBg: 'bg-sky-500/10',
    },
    {
        key: 'upcoming',
        label: 'Upcoming',
        icon: CalendarArrowUp,
        accent: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-500/10',
    },
    {
        key: 'pending',
        label: 'Pending',
        icon: Hourglass,
        accent: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-500/10',
    },
    {
        key: 'confirmed',
        label: 'Confirmed',
        icon: CalendarCheck2,
        accent: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-500/10',
    },
    {
        key: 'completed',
        label: 'Completed',
        icon: CircleCheckBig,
        accent: 'text-green-600 dark:text-green-400',
        iconBg: 'bg-green-500/10',
    },
    {
        key: 'cancelled',
        label: 'Cancelled',
        icon: CircleX,
        accent: 'text-red-600 dark:text-red-400',
        iconBg: 'bg-red-500/10',
    },
    {
        key: 'no_show',
        label: 'No Show',
        icon: UserX,
        accent: 'text-neutral-600 dark:text-neutral-300',
        iconBg: 'bg-neutral-500/10',
    },
] as const;

function WidgetList({
    title,
    description,
    items,
    showDate = false,
    empty,
}: {
    title: string;
    description?: string;
    items: AppointmentWidgetItem[];
    showDate?: boolean;
    empty: string;
}) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex-1">
                {items.length === 0 ? (
                    <EmptyState
                        icon={CalendarDays}
                        title="Nothing here yet"
                        description={empty}
                    />
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={showAppointment(item.id)}
                                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {item.customer_name ?? 'Customer'}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {item.service_name ?? '—'}
                                            {showDate && item.appointment_date
                                                ? ` · ${formatDate(item.appointment_date, 'MMM d')}`
                                                : ''}
                                            {` · ${formatTime(item.start_time)}`}
                                        </p>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    summary,
    monthlyTrends,
    statusDistribution,
    mostBookedServices,
    todaySchedule,
    upcomingAppointments,
    recentBookings,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Dashboard"
                    description="An overview of your appointment activity."
                >
                    <Button
                        variant="outline"
                        render={<Link href={reports()} />}
                    >
                        <FileChartColumn /> Reports
                    </Button>
                    <Button
                        variant="outline"
                        render={<Link href={calendar()} />}
                    >
                        <CalendarDays /> Calendar
                    </Button>
                    <Button render={<Link href={createAppointment()} />}>
                        <CalendarPlus /> Add Appointment
                    </Button>
                </PageHeader>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {cards.map((c) => (
                        <StatCard
                            key={c.key}
                            label={c.label}
                            value={summary[c.key]}
                            icon={c.icon}
                            accent={c.accent}
                            iconBg={c.iconBg}
                        />
                    ))}
                </div>

                {/* Charts */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Monthly Appointment Trends</CardTitle>
                            <CardDescription>Last 12 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppLineChart
                                data={monthlyTrends}
                                xKey="month"
                                yKey="count"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Status Distribution</CardTitle>
                            <CardDescription>All appointments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppPieChart data={statusDistribution} />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Most Booked Services</CardTitle>
                        <CardDescription>
                            Top services by number of appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppBarChart
                            data={mostBookedServices}
                            xKey="name"
                            yKey="count"
                            height={260}
                        />
                    </CardContent>
                </Card>

                {/* Widgets */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <WidgetList
                        title="Today's Schedule"
                        description={formatDate(new Date().toISOString())}
                        items={todaySchedule}
                        empty="No appointments scheduled for today."
                    />
                    <WidgetList
                        title="Upcoming Appointments"
                        description="Next scheduled bookings"
                        items={upcomingAppointments}
                        showDate
                        empty="No upcoming appointments."
                    />
                    <WidgetList
                        title="Recent Bookings"
                        description="Latest created appointments"
                        items={recentBookings}
                        showDate
                        empty="No bookings yet."
                    />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
