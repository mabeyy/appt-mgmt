import { Head } from '@inertiajs/react';
import {
    CalendarCheck2,
    CircleCheckBig,
    CircleX,
    Download,
    Hourglass,
    UserX,
} from 'lucide-react';
import { AppBarChart, AppPieChart } from '@/components/shared/charts';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTableFilters } from '@/hooks/use-table-filters';
import { exportMethod, index } from '@/routes/reports';

type Props = {
    filters: { period: string; date_from: string; date_to: string };
    summary: {
        total: number;
        completed: number;
        cancelled: number;
        pending: number;
        no_show: number;
    };
    statusDistribution: Array<{ status: string; value: number; color: string }>;
    mostRequested: Array<{ name: string; count: number }>;
    staffPerformance: Array<{ name: string; total: number; completed: number }>;
};

const PERIODS = {
    daily: 'Today',
    weekly: 'This week',
    monthly: 'This month',
    yearly: 'This year',
    custom: 'Custom range',
};

export default function ReportsIndex({
    filters,
    summary,
    statusDistribution,
    mostRequested,
    staffPerformance,
}: Props) {
    const { values, setValue } = useTableFilters(
        index().url,
        {
            period: filters.period ?? 'monthly',
            date_from: filters.date_from ?? '',
            date_to: filters.date_to ?? '',
        },
        150,
    );

    const exportUrl = (format: 'csv' | 'excel' | 'pdf') => {
        const params = new URLSearchParams({ period: values.period, format });

        if (values.period === 'custom') {
            params.set('date_from', values.date_from);
            params.set('date_to', values.date_to);
        }

        return `${exportMethod().url}?${params.toString()}`;
    };

    return (
        <>
            <Head title="Reports" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Reports"
                    description="Analyze appointment performance over time."
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button>
                                    <Download /> Export
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                render={<a href={exportUrl('csv')} />}
                            >
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                render={<a href={exportUrl('excel')} />}
                            >
                                Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                render={<a href={exportUrl('pdf')} />}
                            >
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </PageHeader>

                {/* Period filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="grid gap-1.5">
                        <Label>Period</Label>
                        <Select
                            value={values.period}
                            onValueChange={(v) => setValue('period', String(v))}
                            items={PERIODS}
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PERIODS).map(
                                    ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {values.period === 'custom' && (
                        <div className="grid gap-1.5">
                            <Label>Date range</Label>
                            <DateRangePicker
                                from={values.date_from}
                                to={values.date_to}
                                onChange={({ from, to }) => {
                                    setValue('date_from', from);
                                    setValue('date_to', to);
                                }}
                                className="sm:w-72"
                            />
                        </div>
                    )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <StatCard
                        label="Total"
                        value={summary.total}
                        icon={CalendarCheck2}
                    />
                    <StatCard
                        label="Completed"
                        value={summary.completed}
                        icon={CircleCheckBig}
                        accent="text-green-600 dark:text-green-400"
                        iconBg="bg-green-500/10"
                    />
                    <StatCard
                        label="Pending"
                        value={summary.pending}
                        icon={Hourglass}
                        accent="text-amber-600 dark:text-amber-400"
                        iconBg="bg-amber-500/10"
                    />
                    <StatCard
                        label="Cancelled"
                        value={summary.cancelled}
                        icon={CircleX}
                        accent="text-red-600 dark:text-red-400"
                        iconBg="bg-red-500/10"
                    />
                    <StatCard
                        label="No Show"
                        value={summary.no_show}
                        icon={UserX}
                        accent="text-neutral-600 dark:text-neutral-300"
                        iconBg="bg-neutral-500/10"
                    />
                </div>

                {/* Charts */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Appointment Status Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AppPieChart data={statusDistribution} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Requested Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AppBarChart
                                data={mostRequested}
                                xKey="name"
                                yKey="count"
                                height={260}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Tables */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="py-0">
                        <CardHeader className="pt-6">
                            <CardTitle>Staff Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead className="text-right">
                                            Total
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Completed
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Rate
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffPerformance.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="py-6 text-center text-sm text-muted-foreground"
                                            >
                                                No data for this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        staffPerformance.map((s) => (
                                            <TableRow key={s.name}>
                                                <TableCell className="font-medium">
                                                    {s.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {s.total}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {s.completed}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {s.total > 0
                                                        ? Math.round(
                                                              (s.completed /
                                                                  s.total) *
                                                                  100,
                                                          )
                                                        : 0}
                                                    %
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="py-0">
                        <CardHeader className="pt-6">
                            <CardTitle>Most Requested Services</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Service</TableHead>
                                        <TableHead className="text-right">
                                            Bookings
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mostRequested.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={2}
                                                className="py-6 text-center text-sm text-muted-foreground"
                                            >
                                                No data for this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        mostRequested.map((s) => (
                                            <TableRow key={s.name}>
                                                <TableCell className="font-medium">
                                                    {s.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {s.count}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [{ title: 'Reports', href: index() }],
};
