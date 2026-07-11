import { Head, Link } from '@inertiajs/react';
import { Contact, Copy, Eye, Merge, Pencil, Plus } from 'lucide-react';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { MergeCustomersDialog } from '@/components/customers/merge-customers-dialog';
import type { MergeMember } from '@/components/customers/merge-customers-dialog';
import { DataPagination } from '@/components/shared/data-pagination';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTableFilters } from '@/hooks/use-table-filters';
import { destroy, index, show } from '@/routes/customers';
import type { Customer, Paginated } from '@/types';

type Props = {
    customers: Paginated<Customer>;
    filters: { search: string; duplicates: boolean };
    duplicateCount: number;
    duplicateGroups: Array<{ members: MergeMember[] }>;
};

export default function CustomersIndex({
    customers,
    filters,
    duplicateCount,
    duplicateGroups,
}: Props) {
    const { values, setValue } = useTableFilters(index().url, {
        search: filters.search ?? '',
        duplicates: filters.duplicates ? '1' : '',
    });

    // Map each duplicate customer to the group it should merge within.
    const groupFor = new Map<number, MergeMember[]>();

    for (const group of duplicateGroups) {
        for (const member of group.members) {
            groupFor.set(member.id, group.members);
        }
    }

    return (
        <>
            <Head title="Customers" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Customers"
                    description="Manage your customer records."
                >
                    <CustomerFormDialog
                        trigger={
                            <Button>
                                <Plus /> Add Customer
                            </Button>
                        }
                    />
                </PageHeader>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SearchInput
                        value={values.search}
                        onChange={(v) => setValue('search', v)}
                        placeholder="Search customers..."
                        className="sm:max-w-xs sm:flex-1"
                    />
                    {(duplicateCount > 0 || values.duplicates === '1') && (
                        <Button
                            variant={
                                values.duplicates === '1'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            onClick={() =>
                                setValue(
                                    'duplicates',
                                    values.duplicates === '1' ? '' : '1',
                                )
                            }
                        >
                            <Copy />
                            {values.duplicates === '1'
                                ? 'Showing duplicates'
                                : `Possible duplicates (${duplicateCount})`}
                        </Button>
                    )}
                </div>

                <Card className="py-0">
                    {customers.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Contact}
                                title="No customers yet"
                                description="Customers are created automatically when you book appointments, or add them here."
                            >
                                <CustomerFormDialog
                                    trigger={
                                        <Button>
                                            <Plus /> Add Customer
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
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Appointments</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            <span className="flex items-center gap-2">
                                                <Link
                                                    href={show(customer.id)}
                                                    className="hover:underline"
                                                >
                                                    {customer.full_name}
                                                </Link>
                                                {customer.is_duplicate && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="gap-1 font-normal text-amber-700 dark:text-amber-400"
                                                    >
                                                        <Copy className="size-3" />
                                                        Duplicate
                                                    </Badge>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {customer.email ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {customer.phone ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {customer.appointments_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {customer.is_duplicate &&
                                                    groupFor.has(
                                                        customer.id,
                                                    ) && (
                                                        <MergeCustomersDialog
                                                            members={
                                                                groupFor.get(
                                                                    customer.id,
                                                                )!
                                                            }
                                                            trigger={
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                >
                                                                    <Merge />
                                                                    <span className="sr-only">
                                                                        Merge
                                                                        duplicates
                                                                    </span>
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    render={
                                                        <Link
                                                            href={show(
                                                                customer.id,
                                                            )}
                                                        />
                                                    }
                                                >
                                                    <Eye />
                                                    <span className="sr-only">
                                                        View
                                                    </span>
                                                </Button>
                                                <CustomerFormDialog
                                                    customer={customer}
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
                                                    title="Delete customer?"
                                                    description={`"${customer.full_name}" will be removed. Customers with existing appointments can't be deleted.`}
                                                    url={
                                                        destroy(customer.id).url
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
                    links={customers.links}
                    from={customers.from}
                    to={customers.to}
                    total={customers.total}
                />
            </div>
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [{ title: 'Customers', href: index() }],
};
