import { cn } from '@/lib/utils';
import type { AppointmentStatusValue } from '@/types';

const STATUS_STYLES: Record<
    AppointmentStatusValue,
    { label: string; className: string; dot: string }
> = {
    pending: {
        label: 'Pending',
        className:
            'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        dot: 'bg-amber-500',
    },
    confirmed: {
        label: 'Confirmed',
        className:
            'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
        dot: 'bg-blue-500',
    },
    completed: {
        label: 'Completed',
        className:
            'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
        dot: 'bg-green-500',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        dot: 'bg-red-500',
    },
    no_show: {
        label: 'No Show',
        className:
            'bg-neutral-200 text-neutral-700 dark:bg-neutral-500/15 dark:text-neutral-300',
        dot: 'bg-neutral-500',
    },
};

export function StatusBadge({
    status,
    className,
}: {
    status: AppointmentStatusValue;
    className?: string;
}) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                style.className,
                className,
            )}
        >
            <span className={cn('size-1.5 rounded-full', style.dot)} />
            {style.label}
        </span>
    );
}
