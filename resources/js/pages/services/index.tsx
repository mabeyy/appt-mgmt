import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataPagination } from '@/components/data-pagination';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { ServiceFormDialog } from '@/components/service-form-dialog';
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
import { formatCurrency, formatDuration } from '@/lib/format';
import { destroy, index } from '@/routes/services';
import type { Paginated, Service } from '@/types';

type Props = {
    services: Paginated<Service>;
    filters: { search: string; status: string; sort: string; direction: string };
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
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={values.search}
                            onChange={(e) => setValue('search', e.target.value)}
                            placeholder="Search services..."
                            className="pl-8"
                        />
                    </div>
                    <Select
                        value={values.status}
                        onValueChange={(v) => setValue('status', String(v))}
                        items={{ all: 'All statuses', active: 'Active', inactive: 'Inactive' }}
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.data.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div className="font-medium">{service.name}</div>
                                            {service.description && (
                                                <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                    {service.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDuration(service.duration)}</TableCell>
                                        <TableCell>{formatCurrency(service.price)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={service.is_active ? 'default' : 'secondary'}
                                            >
                                                {service.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <ServiceFormDialog
                                                    service={service}
                                                    trigger={
                                                        <Button variant="ghost" size="icon-sm">
                                                            <Pencil />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    }
                                                />
                                                <ConfirmDialog
                                                    title="Delete service?"
                                                    description={`"${service.name}" will be permanently removed. Services with existing appointments can't be deleted — mark them inactive instead.`}
                                                    confirmLabel="Delete"
                                                    destructive
                                                    onConfirm={() =>
                                                        router.delete(destroy(service.id).url, {
                                                            preserveScroll: true,
                                                        })
                                                    }
                                                    trigger={
                                                        <Button variant="ghost" size="icon-sm">
                                                            <Trash2 className="text-destructive" />
                                                            <span className="sr-only">Delete</span>
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
