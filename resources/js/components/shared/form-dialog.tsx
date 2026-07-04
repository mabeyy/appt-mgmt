import type { InertiaFormProps } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent, ReactElement, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type RouteHelpers = {
    store: () => { url: string };
    update: (id: number) => { url: string };
};

/**
 * Owns the open-state and store/update branching shared by every entity
 * form dialog, so each dialog only declares its fields.
 */
export function useFormDialog<TForm extends Record<string, any>>(
    form: InertiaFormProps<TForm>,
    routes: RouteHelpers,
    id?: number,
) {
    const [open, setOpen] = useState(false);
    const isEdit = id != null;

    const onOpenChange = (next: boolean) => {
        setOpen(next);

        if (next && !isEdit) {
            form.reset();
        }

        form.clearErrors();
    };

    const submit = (e: FormEvent) => {
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

        if (isEdit && id != null) {
            form.put(routes.update(id).url, options);
        } else {
            form.post(routes.store().url, options);
        }
    };

    return { open, onOpenChange, submit, isEdit };
}

export function FormDialog({
    trigger,
    open,
    onOpenChange,
    title,
    description,
    submitLabel,
    processing,
    onSubmit,
    children,
}: {
    trigger: ReactElement;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    submitLabel: string;
    processing: boolean;
    onSubmit: (e: FormEvent) => void;
    children: ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">{children}</div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
