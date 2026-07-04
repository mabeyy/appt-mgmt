import { Head, Link, router } from '@inertiajs/react';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { AppointmentBulkBar } from '@/components/appointments/appointment-bulk-bar';
import { AppointmentFilters } from '@/components/appointments/appointment-filters';
import type { AppointmentFiltersState } from '@/components/appointments/appointment-filters';
import { AppointmentTable } from '@/components/appointments/appointment-table';
import { DataPagination } from '@/components/shared/data-pagination';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useTableFilters } from '@/hooks/use-table-filters';
import { bulkDestroy, bulkStatus, create, index } from '@/routes/appointments';
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

export default function AppointmentsIndex({
    appointments,
    filters,
    services,
    staff,
    statuses,
}: Props) {
    const { values, setValue, setValues, reset } =
        useTableFilters<AppointmentFiltersState>(index().url, {
            search: filters.search ?? '',
            status: filters.status ?? 'all',
            service_id: filters.service_id ?? 'all',
            staff_id: filters.staff_id ?? 'all',
            date_from: filters.date_from ?? '',
            date_to: filters.date_to ?? '',
            sort: filters.sort ?? 'appointment_date',
            direction: filters.direction ?? 'desc',
        });

    const [selected, setSelected] = useState<number[]>([]);
    const pageIds = appointments.data.map((a) => a.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

    const toggleAll = () => setSelected(allSelected ? [] : pageIds);
    const toggleOne = (id: number) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const onSort = (column: string) =>
        setValues((prev) => ({
            ...prev,
            sort: column,
            direction:
                prev.sort === column && prev.direction === 'asc'
                    ? 'desc'
                    : 'asc',
        }));

    const hasFilters = Boolean(
        values.search ||
        values.status !== 'all' ||
        values.service_id !== 'all' ||
        values.staff_id !== 'all' ||
        values.date_from ||
        values.date_to,
    );

    const bulkOptions = {
        preserveScroll: true,
        onSuccess: () => setSelected([]),
    };
    const onBulkDelete = () =>
        router.post(bulkDestroy().url, { ids: selected }, bulkOptions);
    const onBulkStatus = (status: string) =>
        router.post(bulkStatus().url, { ids: selected, status }, bulkOptions);

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

                <AppointmentFilters
                    values={values}
                    setValue={setValue}
                    reset={reset}
                    hasFilters={hasFilters}
                    services={services}
                    staff={staff}
                    statuses={statuses}
                />

                <AppointmentBulkBar
                    count={selected.length}
                    statuses={statuses}
                    onSetStatus={onBulkStatus}
                    onDelete={onBulkDelete}
                />

                <AppointmentTable
                    appointments={appointments.data}
                    selected={selected}
                    allSelected={allSelected}
                    onToggleAll={toggleAll}
                    onToggleOne={toggleOne}
                    sort={values.sort}
                    direction={values.direction}
                    onSort={onSort}
                    hasFilters={hasFilters}
                />

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
