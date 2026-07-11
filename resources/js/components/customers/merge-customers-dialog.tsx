import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { merge as mergeRoute } from '@/routes/customers';

export type MergeMember = {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    appointments_count: number;
};

export function MergeCustomersDialog({
    members,
    trigger,
}: {
    members: MergeMember[];
    trigger: ReactElement;
}) {
    const [open, setOpen] = useState(false);
    const [survivorId, setSurvivorId] = useState<number>(members[0]?.id);
    const [processing, setProcessing] = useState(false);

    const survivor =
        members.find((m) => m.id === survivorId) ?? members[0];
    const duplicates = members.filter((m) => m.id !== survivorId);
    const movingAppointments = duplicates.reduce(
        (sum, m) => sum + (m.appointments_count ?? 0),
        0,
    );

    const submit = () => {
        router.post(
            mergeRoute().url,
            {
                survivor_id: survivorId,
                duplicate_ids: duplicates.map((m) => m.id),
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setOpen(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger} />
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Merge duplicate customers</DialogTitle>
                    <DialogDescription>
                        Pick the record to keep. The others will be merged into
                        it and removed.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    {members.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setSurvivorId(m.id)}
                            className={cn(
                                'flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                                m.id === survivorId
                                    ? 'border-primary ring-1 ring-primary'
                                    : 'border-input hover:border-primary/60',
                            )}
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 font-medium">
                                    <span className="truncate">
                                        {m.full_name}
                                    </span>
                                    {m.id === survivorId && (
                                        <span className="text-xs font-normal text-primary">
                                            · Keep
                                        </span>
                                    )}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {m.email ?? '—'} · {m.phone ?? '—'}
                                </div>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {m.appointments_count} appt
                            </span>
                        </button>
                    ))}
                </div>

                <p className="text-sm text-muted-foreground">
                    Keeping <span className="font-medium">{survivor?.full_name}</span>.{' '}
                    {movingAppointments} appointment
                    {movingAppointments === 1 ? '' : 's'} will move to it, and{' '}
                    {duplicates.length} record
                    {duplicates.length === 1 ? '' : 's'} will be permanently
                    deleted.
                </p>

                <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                        Cancel
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={submit}
                        disabled={processing || duplicates.length === 0}
                    >
                        Merge {duplicates.length + 1} into 1
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
