import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function TimeSlotGrid({
    slots,
    loading,
    value,
    onSelect,
}: {
    slots: string[];
    loading: boolean;
    value: string;
    onSelect: (time: string) => void;
}) {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No open times on this day. Please choose another date.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((time) => (
                <button
                    key={time}
                    type="button"
                    onClick={() => onSelect(time)}
                    className={cn(
                        'rounded-md border px-3 py-2 text-sm transition-colors hover:border-primary/60',
                        value === time
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input',
                    )}
                >
                    {time}
                </button>
            ))}
        </div>
    );
}
