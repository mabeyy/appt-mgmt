import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DAYS = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
];

export function WorkingDaysPicker({
    value,
    onChange,
    label = 'Working days',
}: {
    value: string[];
    onChange: (days: string[]) => void;
    label?: string;
}) {
    const toggle = (day: string) =>
        onChange(
            value.includes(day)
                ? value.filter((d) => d !== day)
                : [...value, day],
        );

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                    const active = value.includes(day.key);

                    return (
                        <button
                            key={day.key}
                            type="button"
                            onClick={() => toggle(day.key)}
                            className={cn(
                                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
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
    );
}
