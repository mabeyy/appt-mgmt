import { Head, Link } from '@inertiajs/react';
import { Contact, Eye, Pencil, Plus } from 'lucide-react';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { DataPagination } from '@/components/shared/data-pagination';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
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
    filters: { search: string };
};

export default function CustomersIndex({ customers, filters }: Props) {
    const { values, setValue } = useTableFilters(index().url, {
        search: filters.search ?? '',
    });

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

                <SearchInput
                    value={values.search}
                    onChange={(v) => setValue('search', v)}
                    placeholder="Search customers..."
                    className="sm:max-w-xs"
                />

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
                                            <Link
                                                href={show(customer.id)}
                                                className="hover:underline"
                                            >
                                                {customer.full_name}
                                            </Link>
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
