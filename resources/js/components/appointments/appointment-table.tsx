import { Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CalendarPlus,
    Eye,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDate, formatTime } from '@/lib/format';
import { create, destroy, edit, show } from '@/routes/appointments';
import type { Appointment } from '@/types';

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

export function AppointmentTable({
    appointments,
    selected,
    allSelected,
    onToggleAll,
    onToggleOne,
    sort,
    direction,
    onSort,
    hasFilters,
}: {
    appointments: Appointment[];
    selected: number[];
    allSelected: boolean;
    onToggleAll: () => void;
    onToggleOne: (id: number) => void;
    sort: string;
    direction: string;
    onSort: (column: string) => void;
    hasFilters: boolean;
}) {
    if (appointments.length === 0) {
        return (
            <Card className="py-0">
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
            </Card>
        );
    }

    return (
        <Card className="py-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleAll}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>
                            <SortHeader
                                label="Number"
                                column="appointment_number"
                                active={sort === 'appointment_number'}
                                direction={direction}
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
                                active={sort === 'appointment_date'}
                                direction={direction}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>
                            <SortHeader
                                label="Status"
                                column="status"
                                active={sort === 'status'}
                                direction={direction}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {appointments.map((appt) => (
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
                                    checked={selected.includes(appt.id)}
                                    onCheckedChange={() => onToggleOne(appt.id)}
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
                            <TableCell>{appt.service?.name ?? '—'}</TableCell>
                            <TableCell>{appt.staff?.name ?? '—'}</TableCell>
                            <TableCell>
                                {formatDate(appt.appointment_date)}
                            </TableCell>
                            <TableCell>{formatTime(appt.start_time)}</TableCell>
                            <TableCell>
                                <StatusBadge status={appt.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        render={<Link href={show(appt.id)} />}
                                    >
                                        <Eye />
                                        <span className="sr-only">View</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        render={<Link href={edit(appt.id)} />}
                                    >
                                        <Pencil />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                    <ConfirmDialog
                                        title="Delete appointment?"
                                        description={`${appt.appointment_number} will be permanently removed.`}
                                        confirmLabel="Delete"
                                        destructive
                                        onConfirm={() =>
                                            router.delete(
                                                destroy(appt.id).url,
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
        </Card>
    );
}
