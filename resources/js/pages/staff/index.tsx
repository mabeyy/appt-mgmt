import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, UsersRound } from 'lucide-react';
import { DataPagination } from '@/components/shared/data-pagination';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { StatusFilterSelect } from '@/components/shared/status-filter-select';
import { StaffFormDialog } from '@/components/staff/staff-form-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTableFilters } from '@/hooks/use-table-filters';
import { formatTime } from '@/lib/format';
import { destroy, index, toggle } from '@/routes/staff';
import type { Paginated, Staff } from '@/types';

type Props = {
    staff: Paginated<Staff>;
    filters: { search: string; status: string };
};

export default function StaffIndex({ staff, filters }: Props) {
    const { values, setValue } = useTableFilters(index().url, {
        search: filters.search ?? '',
        status: filters.status || 'all',
    });

    return (
        <>
            <Head title="Staff" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Staff"
                    description="Manage the people who deliver your services."
                >
                    <StaffFormDialog
                        trigger={
                            <Button>
                                <Plus /> Add Staff
                            </Button>
                        }
                    />
                </PageHeader>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SearchInput
                        value={values.search}
                        onChange={(v) => setValue('search', v)}
                        placeholder="Search staff..."
                        className="flex-1 sm:max-w-xs"
                    />
                    <StatusFilterSelect
                        value={values.status}
                        onValueChange={(v) => setValue('status', v)}
                    />
                </div>

                <Card className="py-0">
                    {staff.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={UsersRound}
                                title="No staff yet"
                                description="Add staff so you can assign them to appointments."
                            >
                                <StaffFormDialog
                                    trigger={
                                        <Button>
                                            <Plus /> Add Staff
                                        </Button>
                                    }
                                />
                            </EmptyState>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Working hours</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.data.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {member.name}
                                            </div>
                                            {member.position && (
                                                <div className="text-xs text-muted-foreground">
                                                    {member.position}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {member.email ?? '—'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {member.phone ?? ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {member.working_start &&
                                            member.working_end ? (
                                                <>
                                                    {formatTime(
                                                        member.working_start,
                                                    )}{' '}
                                                    –{' '}
                                                    {formatTime(
                                                        member.working_end,
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            (
                                                                member.working_days ??
                                                                []
                                                            ).length
                                                        }{' '}
                                                        days/week
                                                    </div>
                                                </>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <Switch
                                                    className="transition-colors duration-300 data-checked:bg-emerald-500 [&_[data-slot=switch-thumb]]:!bg-white"
                                                    checked={member.is_active}
                                                    onCheckedChange={() =>
                                                        router.patch(
                                                            toggle(member.id)
                                                                .url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                                only: ['staff'],
                                                            },
                                                        )
                                                    }
                                                    aria-label={`Toggle ${member.name}`}
                                                />
                                                <span className="inline-block w-16 text-sm text-muted-foreground">
                                                    {member.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </label>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <StaffFormDialog
                                                    staff={member}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                        >
                                                            <Pencil />
                                                            <span className="sr-only">
                                                                Edit
                                                            </span>
                                                        </Button>
                                                    }
                                                />
                                                <DeleteConfirmButton
                                                    title="Delete staff member?"
                                                    description={`"${member.name}" will be removed. Their appointments will be left unassigned.`}
                                                    url={destroy(member.id).url}
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
                    links={staff.links}
                    from={staff.from}
                    to={staff.to}
                    total={staff.total}
                />
            </div>
        </>
    );
}

StaffIndex.layout = {
    breadcrumbs: [{ title: 'Staff', href: index() }],
};
