import { format, parseISO } from 'date-fns';

export function formatDate(
    date: string | null | undefined,
    pattern = 'MMM d, yyyy',
): string {
    if (!date) {
        return '—';
    }

    try {
        return format(parseISO(date), pattern);
    } catch {
        return date;
    }
}

/** Formats a "HH:mm" or "HH:mm:ss" string into a 12-hour time. */
export function formatTime(time: string | null | undefined): string {
    if (!time) {
        return '—';
    }

    const [h, m] = time.split(':');
    const hour = Number(h);

    if (Number.isNaN(hour)) {
        return time;
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;

    return `${hour12}:${m ?? '00'} ${period}`;
}

export function formatCurrency(
    value: string | number | null | undefined,
): string {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
    }).format(Number.isFinite(num) ? num : 0);
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
