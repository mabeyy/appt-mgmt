import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

function clean(params: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
        if (
            value !== '' &&
            value !== null &&
            value !== undefined &&
            value !== 'all'
        ) {
            out[key] = String(value);
        }
    }

    return out;
}

/**
 * Manages index-page filters and pushes them to the server (debounced),
 * preserving scroll + state. Empty / "all" values are dropped from the query.
 */
export function useTableFilters<T extends Record<string, string>>(
    url: string,
    initial: T,
    debounce = 300,
) {
    const [values, setValues] = useState<T>(initial);
    const first = useRef(true);
    // Snapshot the defaults from the first render. `initial` is recomputed from
    // the live `filters` prop each render, so it can't be used as the reset
    // target — after filtering it already holds the applied values.
    const defaults = useRef(initial);

    useEffect(() => {
        if (first.current) {
            first.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(url, clean(values), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, debounce);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, url]);

    const setValue = (key: keyof T, value: string) =>
        setValues((prev) => ({ ...prev, [key]: value }));

    const reset = () => setValues(defaults.current);

    return { values, setValue, setValues, reset };
}
