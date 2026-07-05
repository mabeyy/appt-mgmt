import { useForm } from '@inertiajs/react';
import type { ReactElement } from 'react';
import InputError from '@/components/input-error';
import { CheckboxField } from '@/components/shared/checkbox-field';
import { FormDialog, useFormDialog } from '@/components/shared/form-dialog';
import { WorkingDaysPicker } from '@/components/shared/working-days-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, update } from '@/routes/staff';
import type { Staff } from '@/types';

export function StaffFormDialog({
    trigger,
    staff,
}: {
    trigger: ReactElement;
    staff?: Staff;
}) {
    const form = useForm({
        name: staff?.name ?? '',
        email: staff?.email ?? '',
        phone: staff?.phone ?? '',
        position: staff?.position ?? '',
        working_days: staff?.working_days ?? [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
        ],
        working_start: staff?.working_start?.slice(0, 5) ?? '09:00',
        working_end: staff?.working_end?.slice(0, 5) ?? '17:00',
        is_active: staff?.is_active ?? true,
    });

    const { open, onOpenChange, submit, isEdit } = useFormDialog(
        form,
        { store, update },
        staff?.id,
    );

    return (
        <FormDialog
            trigger={trigger}
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? 'Edit staff member' : 'New staff member'}
            description="Staff can be assigned to appointments."
            submitLabel={isEdit ? 'Save changes' : 'Create staff'}
            processing={form.processing}
            onSubmit={submit}
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    autoFocus
                />
                <InputError message={form.errors.name} />
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
                <Label htmlFor="position">Position</Label>
                <Input
                    id="position"
                    value={form.data.position}
                    onChange={(e) => form.setData('position', e.target.value)}
                    placeholder="e.g. Senior Stylist"
                />
                <InputError message={form.errors.position} />
            </div>

            <WorkingDaysPicker
                value={form.data.working_days}
                onChange={(days) => form.setData('working_days', days)}
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="working_start">Working start</Label>
                    <Input
                        id="working_start"
                        type="time"
                        value={form.data.working_start}
                        onChange={(e) =>
                            form.setData('working_start', e.target.value)
                        }
                    />
                    <InputError message={form.errors.working_start} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="working_end">Working end</Label>
                    <Input
                        id="working_end"
                        type="time"
                        value={form.data.working_end}
                        onChange={(e) =>
                            form.setData('working_end', e.target.value)
                        }
                    />
                    <InputError message={form.errors.working_end} />
                </div>
            </div>

            <CheckboxField
                checked={form.data.is_active}
                onCheckedChange={(checked) =>
                    form.setData('is_active', checked)
                }
                label="Active"
            />
        </FormDialog>
    );
}
