import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import InputError from '@/components/input-error';
import { CheckboxField } from '@/components/shared/checkbox-field';
import { FormDialog, useFormDialog } from '@/components/shared/form-dialog';
import { SegmentedToggle } from '@/components/shared/segmented-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/services';
import type { Service, ServiceGroup } from '@/types';

type GroupMode = 'existing' | 'new';

export function ServiceFormDialog({
    trigger,
    service,
    groups,
}: {
    trigger: ReactElement;
    service?: Service;
    groups: ServiceGroup[];
}) {
    const form = useForm({
        name: service?.name ?? '',
        description: service?.description ?? '',
        duration: service?.duration ?? 30,
        price: service?.price != null ? String(service.price) : '',
        is_active: service?.is_active ?? true,
        service_group_id: service?.service_group_id
            ? String(service.service_group_id)
            : '',
        new_group: '',
    });

    const [groupMode, setGroupMode] = useState<GroupMode>(
        groups.length === 0 ? 'new' : 'existing',
    );

    const switchGroupMode = (mode: GroupMode) => {
        setGroupMode(mode);

        // Keep only the field for the active mode so the backend gets a clean choice.
        if (mode === 'existing') {
            form.setData('new_group', '');
        } else {
            form.setData('service_group_id', '');
        }
    };

    const { open, onOpenChange, submit, isEdit } = useFormDialog(
        form,
        { store, update },
        service?.id,
    );

    return (
        <FormDialog
            trigger={trigger}
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? 'Edit service' : 'New service'}
            description={
                isEdit
                    ? 'Update the details of this service.'
                    : 'Add a service that customers can book.'
            }
            submitLabel={isEdit ? 'Save changes' : 'Create service'}
            processing={form.processing}
            onSubmit={submit}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Service name</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="e.g. Haircut"
                    autoFocus
                />
                <InputError message={form.errors.name} />
            </div>

            <div className="grid gap-2">
                <Label>Group</Label>
                <SegmentedToggle
                    value={groupMode}
                    onChange={switchGroupMode}
                    options={[
                        {
                            value: 'existing',
                            label: 'Existing group',
                            disabled: groups.length === 0,
                        },
                        { value: 'new', label: 'New group' },
                    ]}
                />
                {groupMode === 'existing' ? (
                    <Select
                        value={form.data.service_group_id}
                        onValueChange={(v) =>
                            form.setData('service_group_id', String(v))
                        }
                        items={{
                            '': 'No group',
                            ...Object.fromEntries(
                                groups.map((g) => [String(g.id), g.name]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="No group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">No group</SelectItem>
                            {groups.map((g) => (
                                <SelectItem key={g.id} value={String(g.id)}>
                                    {g.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        value={form.data.new_group}
                        onChange={(e) =>
                            form.setData('new_group', e.target.value)
                        }
                        placeholder="e.g. Hair, Nails, Spa"
                    />
                )}
                <InputError
                    message={
                        form.errors.new_group ?? form.errors.service_group_id
                    }
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                    rows={3}
                    placeholder="Optional description"
                />
                <InputError message={form.errors.description} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                        id="duration"
                        type="number"
                        min={5}
                        value={form.data.duration}
                        onChange={(e) =>
                            form.setData('duration', Number(e.target.value))
                        }
                    />
                    <InputError message={form.errors.duration} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                        id="price"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.data.price}
                        onChange={(e) => form.setData('price', e.target.value)}
                        placeholder="0.00"
                    />
                    <InputError message={form.errors.price} />
                </div>
            </div>

            <CheckboxField
                checked={form.data.is_active}
                onCheckedChange={(checked) =>
                    form.setData('is_active', checked)
                }
                label="Active (available for booking)"
            />
        </FormDialog>
    );
}
