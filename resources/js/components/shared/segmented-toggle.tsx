import { cn } from '@/lib/utils';

type Option<T extends string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

/**
 * A segmented (pill) control for switching between a small set of modes —
 * e.g. an "Existing / New" selector. Theme-aware in both light and dark.
 */
export function SegmentedToggle<T extends string>({
    value,
    onChange,
    options,
    className,
}: {
    value: T;
    onChange: (value: T) => void;
    options: Option<T>[];
    className?: string;
}) {
    return (
        <div
            className={cn(
                'inline-flex w-fit rounded-lg border bg-muted p-0.5 text-sm',
                className,
            )}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    disabled={option.disabled}
                    className={cn(
                        'rounded-md px-3 py-1 font-medium transition-colors',
                        value === option.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        option.disabled &&
                            'cursor-not-allowed opacity-50 hover:text-muted-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
