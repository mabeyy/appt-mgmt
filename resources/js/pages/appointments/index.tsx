import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CalendarPlus,
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataPagination } from '@/components/data-pagination';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { formatDate, formatTime } from '@/lib/format';
import {
    bulkDestroy,
    bulkStatus,
    create,
    destroy,
    edit,
    index,
    show,
} from '@/routes/appointments';
import type {
    Appointment,
    Paginated,
    Service,
    StatusOption,
    Staff,
} from '@/types';

type Props = {
    appointments: Paginated<Appointment>;
    filters: Record<string, string>;
    services: Pick<Service, 'id' | 'name'>[];
    staff: Pick<Staff, 'id' | 'name'>[];
    statuses: StatusOption[];
};

function SortHeader({
    label,
    column,
    active,
    direction,
    onSort,
}: {
    label: string;
    column: string;
    active: boolean;
    direction: string;
    onSort: (column: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSort(column)}
            className="inline-flex items-center gap-1 uppercase transition-colors hover:text-foreground"
        >
            {label}
            {!active ? (
                <ArrowUpDown className="size-3" />
            ) : direction === 'asc' ? (
                <ArrowUp className="size-3" />
            ) : (
                <ArrowDown className="size-3" />
            )}
        </button>
    );
}

export default function AppointmentsIndex({
    appointments,
    filters,
    services,
    staff,
    statuses,
}: Props) {
    const { values, setValue, setValues, reset } = useTableFilters(
        index().url,
        {
            search: filters.search ?? '',
            status: filters.status ?? 'all',
            service_id: filters.service_id ?? 'all',
            staff_id: filters.staff_id ?? 'all',
            date_from: filters.date_from ?? '',
            date_to: filters.date_to ?? '',
            sort: filters.sort ?? 'appointment_date',
            direction: filters.direction ?? 'desc',
        },
    );

    const [selected, setSelected] = useState<number[]>([]);
    const pageIds = appointments.data.map((a) => a.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

    const toggleAll = () => setSelected(allSelected ? [] : pageIds);
    const toggleOne = (id: number) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const onSort = (column: string) => {
        setValues((prev) => ({
            ...prev,
            sort: column,
            direction:
                prev.sort === column && prev.direction === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    };

    const hasFilters =
        values.search ||
        values.status !== 'all' ||
        values.service_id !== 'all' ||
        values.staff_id !== 'all' ||
        values.date_from ||
        values.date_to;

    const doBulkDelete = () =>
        router.post(
            bulkDestroy().url,
            { ids: selected },
            { preserveScroll: true, onSuccess: () => setSelected([]) },
        );

    const doBulkStatus = (status: string) =>
        router.post(
            bulkStatus().url,
            { ids: selected, status },
            { preserveScroll: true, onSuccess: () => setSelected([]) },
        );

    return (
        <>
            <Head title="Appointments" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Appointments"
                    description="Search, filter, and manage all appointments."
                >
                    <Button render={<Link href={create()} />}>
                        <CalendarPlus /> Add Appointment
                    </Button>
                </PageHeader>

                {/* Filters */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={values.search}
                            onChange={(e) => setValue('search', e.target.value)}
                            placeholder="Search # or customer..."
                            className="pl-8"
                        />
                    </div>
                    <Select
                        value={values.status}
                        onValueChange={(v) => setValue('status', String(v))}
                        items={{
                            all: 'All statuses',
                            ...Object.fromEntries(
                                statuses.map((s) => [s.value, s.label]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={values.service_id}
                        onValueChange={(v) => setValue('service_id', String(v))}
                        items={{
                            all: 'All services',
                            ...Object.fromEntries(
                                services.map((s) => [String(s.id), s.name]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All services</SelectItem>
                            {services.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={values.staff_id}
                        onValueChange={(v) => setValue('staff_id', String(v))}
                        items={{
                            all: 'All staff',
                            ...Object.fromEntries(
                                staff.map((s) => [String(s.id), s.name]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All staff</SelectItem>
                            {staff.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="grid gap-1.5">
                        <span className="text-xs text-muted-foreground">
                            From
                        </span>
                        <Input
                            type="date"
                            value={values.date_from}
                            onChange={(e) =>
                                setValue('date_from', e.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <span className="text-xs text-muted-foreground">
                            To
                        </span>
                        <Input
                            type="date"
                            value={values.date_to}
                            onChange={(e) =>
                                setValue('date_to', e.target.value)
                            }
                        />
                    </div>
                    {hasFilters && (
                        <div className="flex items-end">
                            <Button variant="ghost" onClick={reset}>
                                <X /> Clear filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bulk action bar */}
                {selected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
                        <span className="text-sm font-medium">
                            {selected.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                            <Select
                                value=""
                                onValueChange={(v) =>
                                    v && doBulkStatus(String(v))
                                }
                                items={Object.fromEntries(
                                    statuses.map((s) => [s.value, s.label]),
                                )}
                            >
                                <SelectTrigger size="sm">
                                    <SelectValue placeholder="Set status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                        >
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <ConfirmDialog
                                title={`Delete ${selected.length} appointment(s)?`}
                                description="This action cannot be undone."
                                confirmLabel="Delete"
                                destructive
                                onConfirm={doBulkDelete}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <Trash2 className="text-destructive" />{' '}
                                        Delete
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                )}

                <Card className="py-0">
                    {appointments.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={CalendarPlus}
                                title="No appointments found"
                                description={
                                    hasFilters
                                        ? 'Try adjusting your filters.'
                                        : 'Create your first appointment to get started.'
                                }
                            >
                                {!hasFilters && (
                                    <Button render={<Link href={create()} />}>
                                        <Plus /> Add Appointment
                                    </Button>
                                )}
                            </EmptyState>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={toggleAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortHeader
                                            label="Number"
                                            column="appointment_number"
                                            active={
                                                values.sort ===
                                                'appointment_number'
                                            }
                                            direction={values.direction}
                                            onSort={onSort}
                                        />
                                    </TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Staff</TableHead>
                                    <TableHead>
                                        <SortHeader
                                            label="Date"
                                            column="appointment_date"
                                            active={
                                                values.sort ===
                                                'appointment_date'
                                            }
                                            direction={values.direction}
                                            onSort={onSort}
                                        />
                                    </TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>
                                        <SortHeader
                                            label="Status"
                                            column="status"
                                            active={values.sort === 'status'}
                                            direction={values.direction}
                                            onSort={onSort}
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointments.data.map((appt) => (
                                    <TableRow
                                        key={appt.id}
                                        data-state={
                                            selected.includes(appt.id)
                                                ? 'selected'
                                                : undefined
                                        }
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selected.includes(
                                                    appt.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleOne(appt.id)
                                                }
                                                aria-label={`Select ${appt.appointment_number}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={show(appt.id)}
                                                className="hover:underline"
                                            >
                                                {appt.appointment_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {appt.customer?.full_name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {appt.service?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {appt.staff?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(appt.appointment_date)}
                                        </TableCell>
                                        <TableCell>
                                            {formatTime(appt.start_time)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={appt.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    render={
                                                        <Link
                                                            href={show(appt.id)}
                                                        />
                                                    }
                                                >
                                                    <Eye />
                                                    <span className="sr-only">
                                                        View
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    render={
                                                        <Link
                                                            href={edit(appt.id)}
                                                        />
                                                    }
                                                >
                                                    <Pencil />
                                                    <span className="sr-only">
                                                        Edit
                                                    </span>
                                                </Button>
                                                <ConfirmDialog
                                                    title="Delete appointment?"
                                                    description={`${appt.appointment_number} will be permanently removed.`}
                                                    confirmLabel="Delete"
                                                    destructive
                                                    onConfirm={() =>
                                                        router.delete(
                                                            destroy(appt.id)
                                                                .url,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                        >
                                                            <Trash2 className="text-destructive" />
                                                            <span className="sr-only">
                                                                Delete
                                                            </span>
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                <DataPagination
                    links={appointments.links}
                    from={appointments.from}
                    to={appointments.to}
                    total={appointments.total}
                />
            </div>
        </>
    );
}

AppointmentsIndex.layout = {
    breadcrumbs: [{ title: 'Appointments', href: index() }],
};
