import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataPagination } from '@/components/shared/data-pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StaffFormDialog } from '@/components/shared/staff-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { formatTime } from '@/lib/format';
import { destroy, index } from '@/routes/staff';
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
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={values.search}
                            onChange={(e) => setValue('search', e.target.value)}
                            placeholder="Search staff..."
                            className="pl-8"
                        />
                    </div>
                    <Select
                        value={values.status}
                        onValueChange={(v) => setValue('status', String(v))}
                        items={{
                            all: 'All statuses',
                            active: 'Active',
                            inactive: 'Inactive',
                        }}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
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
                                            <Badge
                                                variant={
                                                    member.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {member.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
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
                                                <ConfirmDialog
                                                    title="Delete staff member?"
                                                    description={`"${member.name}" will be removed. Their appointments will be left unassigned.`}
                                                    confirmLabel="Delete"
                                                    destructive
                                                    onConfirm={() =>
                                                        router.delete(
                                                            destroy(member.id)
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
