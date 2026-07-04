import { useForm } from '@inertiajs/react';
import type { ReactElement } from 'react';
import InputError from '@/components/input-error';
import { FormDialog, useFormDialog } from '@/components/shared/form-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/services';
import type { Service } from '@/types';

export function ServiceFormDialog({
    trigger,
    service,
}: {
    trigger: ReactElement;
    service?: Service;
}) {
    const form = useForm({
        name: service?.name ?? '',
        description: service?.description ?? '',
        duration: service?.duration ?? 30,
        price: service?.price != null ? String(service.price) : '',
        is_active: service?.is_active ?? true,
    });

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

            <label className="flex items-center gap-2.5">
                <Checkbox
                    checked={form.data.is_active}
                    onCheckedChange={(checked) =>
                        form.setData('is_active', checked === true)
                    }
                />
                <span className="text-sm">Active (available for booking)</span>
            </label>
        </FormDialog>
    );
}
