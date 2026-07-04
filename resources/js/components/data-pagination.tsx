import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { PaginationLink } from '@/types';

function label(raw: string): string {
    return raw
        .replace('&laquo;', '')
        .replace('&raquo;', '')
        .replace('pagination.previous', 'Previous')
        .replace('pagination.next', 'Next')
        .trim();
}

export function DataPagination({
    links,
    from,
    to,
    total,
}: {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}) {
    if (total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{from ?? 0}</span>{' '}
                to <span className="font-medium text-foreground">{to ?? 0}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> results
            </p>
            <div className="flex flex-wrap items-center gap-1">
                {links.map((link, i) => {
                    const text = label(link.label);
                    if (!link.url) {
                        return (
                            <span
                                key={i}
                                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm text-muted-foreground/50"
                            >
                                {text}
                            </span>
                        );
                    }
                    return (
                        <Link
                            key={i}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={cn(
                                'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors',
                                link.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted',
                            )}
                        >
                            {text}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
