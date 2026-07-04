import { Head } from '@inertiajs/react';
import { Pencil, Plus, Sparkles } from 'lucide-react';
import { ServiceFormDialog } from '@/components/services/service-form-dialog';
import { DataPagination } from '@/components/shared/data-pagination';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { StatusFilterSelect } from '@/components/shared/status-filter-select';
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
import { formatCurrency, formatDuration } from '@/lib/format';
import { destroy, index } from '@/routes/services';
import type { Paginated, Service } from '@/types';

type Props = {
    services: Paginated<Service>;
    filters: {
        search: string;
        status: string;
        sort: string;
        direction: string;
    };
};

export default function ServicesIndex({ services, filters }: Props) {
    const { values, setValue } = useTableFilters(index().url, {
        search: filters.search ?? '',
        status: filters.status || 'all',
    });

    return (
        <>
            <Head title="Services" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Services"
                    description="Manage the services customers can book."
                >
                    <ServiceFormDialog
                        trigger={
                            <Button>
                                <Plus /> Add Service
                            </Button>
                        }
                    />
                </PageHeader>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SearchInput
                        value={values.search}
                        onChange={(v) => setValue('search', v)}
                        placeholder="Search services..."
                        className="flex-1 sm:max-w-xs"
                    />
                    <StatusFilterSelect
                        value={values.status}
                        onValueChange={(v) => setValue('status', v)}
                    />
                </div>

                <Card className="py-0">
                    {services.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Sparkles}
                                title="No services yet"
                                description="Create your first service to start taking appointments."
                            >
                                <ServiceFormDialog
                                    trigger={
                                        <Button>
                                            <Plus /> Add Service
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
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.data.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {service.name}
                                            </div>
                                            {service.description && (
                                                <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                    {service.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatDuration(service.duration)}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(service.price)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    service.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {service.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <ServiceFormDialog
                                                    service={service}
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
                                                    title="Delete service?"
                                                    description={`"${service.name}" will be permanently removed. Services with existing appointments can't be deleted — mark them inactive instead.`}
                                                    url={
                                                        destroy(service.id).url
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
                    links={services.links}
                    from={services.from}
                    to={services.to}
                    total={services.total}
                />
            </div>
        </>
    );
}

ServicesIndex.layout = {
    breadcrumbs: [{ title: 'Services', href: index() }],
};
