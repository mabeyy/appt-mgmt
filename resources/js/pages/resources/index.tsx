import { Head, router, useForm } from '@inertiajs/react';
import { Check, LayoutGrid, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy, index, store, toggle, update } from '@/routes/resources';

type Resource = {
    id: number;
    name: string;
    isActive: boolean;
    position: number;
    bookingsCount: number;
};

type Props = {
    resources: Resource[];
    activeCount: number;
};

export default function ResourcesIndex({ resources, activeCount }: Props) {
    const form = useForm({ name: '', is_active: true });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const addResource = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => form.reset('name'),
        });
    };

    const startEdit = (resource: Resource) => {
        setEditingId(resource.id);
        setEditName(resource.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = (resource: Resource) => {
        router.put(
            update(resource.id).url,
            { name: editName, is_active: resource.isActive },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => cancelEdit(),
            },
        );
    };

    return (
        <>
            <Head title="Resources" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Resources"
                    description="Manage the courts, rooms and tables customers can book."
                />

                <Card className="p-4">
                    <form
                        onSubmit={addResource}
                        className="flex flex-col gap-3 sm:flex-row sm:items-start"
                    >
                        <div className="flex-1">
                            <Input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="e.g. Court 1"
                                aria-label="Resource name"
                            />
                            <InputError
                                className="mt-1"
                                message={form.errors.name}
                            />
                        </div>
                        <Button type="submit" disabled={form.processing}>
                            <Plus /> Add Resource
                        </Button>
                    </form>
                </Card>

                <Card className="py-0">
                    {resources.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={LayoutGrid}
                                title="No resources yet"
                                description="Add a court, room or table so customers can book it."
                            />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Bookings</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources.map((resource) => (
                                    <TableRow key={resource.id}>
                                        <TableCell>
                                            {editingId === resource.id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) =>
                                                            setEditName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            ) {
                                                                e.preventDefault();
                                                                saveEdit(
                                                                    resource,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                cancelEdit();
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="h-8 max-w-xs"
                                                        aria-label="Resource name"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            saveEdit(resource)
                                                        }
                                                    >
                                                        <Check />
                                                        <span className="sr-only">
                                                            Save
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={cancelEdit}
                                                    >
                                                        <X />
                                                        <span className="sr-only">
                                                            Cancel
                                                        </span>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="font-medium">
                                                    {resource.name}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {resource.bookingsCount} bookings
                                        </TableCell>
                                        <TableCell>
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <Switch
                                                    className="transition-colors duration-300 data-checked:bg-emerald-500 [&_[data-slot=switch-thumb]]:!bg-white"
                                                    checked={resource.isActive}
                                                    onCheckedChange={() =>
                                                        router.patch(
                                                            toggle(resource.id)
                                                                .url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                                only: [
                                                                    'resources',
                                                                    'activeCount',
                                                                ],
                                                            },
                                                        )
                                                    }
                                                    aria-label={`Toggle ${resource.name}`}
                                                />
                                                <span className="inline-block w-16 text-sm text-muted-foreground">
                                                    {resource.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </label>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() =>
                                                        startEdit(resource)
                                                    }
                                                    disabled={
                                                        editingId ===
                                                        resource.id
                                                    }
                                                >
                                                    <Pencil />
                                                    <span className="sr-only">
                                                        Edit
                                                    </span>
                                                </Button>
                                                <DeleteConfirmButton
                                                    title="Delete resource?"
                                                    description={`"${resource.name}" will be permanently removed. Resources with existing bookings can't be deleted — mark them inactive instead.`}
                                                    url={destroy(resource.id).url}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                <p className="text-sm text-muted-foreground">
                    {activeCount} of {resources.length} resources active.
                </p>
            </div>
        </>
    );
}

ResourcesIndex.layout = {
    breadcrumbs: [{ title: 'Resources', href: index() }],
};
