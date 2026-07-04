import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { StatusOption } from '@/types';

export function AppointmentBulkBar({
    count,
    statuses,
    onSetStatus,
    onDelete,
}: {
    count: number;
    statuses: StatusOption[];
    onSetStatus: (status: string) => void;
    onDelete: () => void;
}) {
    if (count === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5">
            <span className="text-sm font-medium">{count} selected</span>
            <div className="flex items-center gap-2">
                <Select
                    value=""
                    onValueChange={(v) => v && onSetStatus(String(v))}
                    items={Object.fromEntries(
                        statuses.map((s) => [s.value, s.label]),
                    )}
                >
                    <SelectTrigger size="sm">
                        <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <ConfirmDialog
                    title={`Delete ${count} appointment(s)?`}
                    description="This action cannot be undone."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={onDelete}
                    trigger={
                        <Button variant="outline" size="sm">
                            <Trash2 className="text-destructive" /> Delete
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
