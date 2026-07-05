import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BookingStepper({
    steps,
    current,
}: {
    steps: string[];
    current: number;
}) {
    return (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;

                return (
                    <li key={label} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                                active &&
                                    'border-primary bg-primary text-primary-foreground',
                                done &&
                                    'border-primary bg-primary/10 text-primary',
                                !active &&
                                    !done &&
                                    'border-input text-muted-foreground',
                            )}
                        >
                            {done ? <Check className="size-3.5" /> : i + 1}
                        </span>
                        <span
                            className={cn(
                                'hidden sm:inline',
                                active
                                    ? 'font-medium text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {label}
                        </span>
                        {i < steps.length - 1 && (
                            <span className="mx-1 h-px w-4 bg-border sm:w-6" />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
