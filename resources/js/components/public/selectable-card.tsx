import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export function SelectableCard({
    selected,
    onClick,
    disabled,
    children,
}: PropsWithChildren<{
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
}>) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'rounded-lg border p-4 text-left transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50',
                selected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-input',
            )}
        >
            {children}
        </button>
    );
}
