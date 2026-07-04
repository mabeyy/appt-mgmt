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
import { store, update } from '@/routes/services';
import type { Service } from '@/types';

export function ServiceFormDialog({
    trigger,
    service,
}: {
    trigger: ReactElement;
    service?: Service;
}) {
    const [open, setOpen] = useState(false);
    const isEdit = Boolean(service);

    const form = useForm({
        name: service?.name ?? '',
        description: service?.description ?? '',
        duration: service?.duration ?? 30,
        price: service?.price != null ? String(service.price) : '',
        is_active: service?.is_active ?? true,
    });

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

        if (isEdit && service) {
            form.put(update(service.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next && !isEdit) {
                    form.reset();
                }

                form.clearErrors();
            }}
        >
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? 'Edit service' : 'New service'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Update the details of this service.'
                                : 'Add a service that customers can book.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Service name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="e.g. Haircut"
                                autoFocus
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                rows={3}
                                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                placeholder="Optional description"
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="duration">
                                    Duration (minutes)
                                </Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={5}
                                    value={form.data.duration}
                                    onChange={(e) =>
                                        form.setData(
                                            'duration',
                                            Number(e.target.value),
                                        )
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
                                    onChange={(e) =>
                                        form.setData('price', e.target.value)
                                    }
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
                            <span className="text-sm">
                                Active (available for booking)
                            </span>
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
                            {isEdit ? 'Save changes' : 'Create service'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
