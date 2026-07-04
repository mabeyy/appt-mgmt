import { useForm } from '@inertiajs/react';
import type { ReactElement } from 'react';
import InputError from '@/components/input-error';
import { FormDialog, useFormDialog } from '@/components/shared/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/customers';
import type { Customer } from '@/types';

export function CustomerFormDialog({
    trigger,
    customer,
}: {
    trigger: ReactElement;
    customer?: Customer;
}) {
    const form = useForm({
        full_name: customer?.full_name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        address: customer?.address ?? '',
    });

    const { open, onOpenChange, submit, isEdit } = useFormDialog(
        form,
        { store, update },
        customer?.id,
    );

    return (
        <FormDialog
            trigger={trigger}
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? 'Edit customer' : 'New customer'}
            description="Customer contact details."
            submitLabel={isEdit ? 'Save changes' : 'Create customer'}
            processing={form.processing}
            onSubmit={submit}
        >
            <div className="grid gap-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                    id="full_name"
                    value={form.data.full_name}
                    onChange={(e) => form.setData('full_name', e.target.value)}
                    autoFocus
                />
                <InputError message={form.errors.full_name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                    <InputError message={form.errors.email} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                    />
                    <InputError message={form.errors.phone} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    value={form.data.address}
                    onChange={(e) => form.setData('address', e.target.value)}
                    rows={2}
                />
                <InputError message={form.errors.address} />
            </div>
        </FormDialog>
    );
}
