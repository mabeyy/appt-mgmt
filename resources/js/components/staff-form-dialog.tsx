import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/staff';
import type { Staff } from '@/types';

const DAYS = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
];

export function StaffFormDialog({
    trigger,
    staff,
}: {
    trigger: ReactElement;
    staff?: Staff;
}) {
    const [open, setOpen] = useState(false);
    const isEdit = Boolean(staff);

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

    const toggleDay = (day: string) => {
        form.setData(
            'working_days',
            form.data.working_days.includes(day)
                ? form.data.working_days.filter((d) => d !== day)
                : [...form.data.working_days, day],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);

                if (!isEdit) {
                    form.reset();
                }
            },
        };

        if (isEdit && staff) {
            form.put(update(staff.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                form.clearErrors();
            }}
        >
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? 'Edit staff member' : 'New staff member'}
                        </DialogTitle>
                        <DialogDescription>
                            Staff can be assigned to appointments.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
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
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.phone} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="position">Position</Label>
                            <Input
                                id="position"
                                value={form.data.position}
                                onChange={(e) =>
                                    form.setData('position', e.target.value)
                                }
                                placeholder="e.g. Senior Stylist"
                            />
                            <InputError message={form.errors.position} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Working days</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {DAYS.map((day) => {
                                    const active =
                                        form.data.working_days.includes(
                                            day.key,
                                        );

                                    return (
                                        <button
                                            key={day.key}
                                            type="button"
                                            onClick={() => toggleDay(day.key)}
                                            className={cn(
                                                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                                active
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-input hover:bg-muted',
                                            )}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="working_start">
                                    Working start
                                </Label>
                                <Input
                                    id="working_start"
                                    type="time"
                                    value={form.data.working_start}
                                    onChange={(e) =>
                                        form.setData(
                                            'working_start',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.working_start}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="working_end">Working end</Label>
                                <Input
                                    id="working_end"
                                    type="time"
                                    value={form.data.working_end}
                                    onChange={(e) =>
                                        form.setData(
                                            'working_end',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.working_end} />
                            </div>
                        </div>

                        <label className="flex items-center gap-2.5">
                            <Checkbox
                                checked={form.data.is_active}
                                onCheckedChange={(checked) =>
                                    form.setData('is_active', checked === true)
                                }
                            />
                            <span className="text-sm">Active</span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {isEdit ? 'Save changes' : 'Create staff'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
