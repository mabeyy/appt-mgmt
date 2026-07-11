import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const WIRE_FORMAT = 'yyyy-MM-dd';
const toDate = (v: string) =>
    v ? parse(v, WIRE_FORMAT, new Date()) : undefined;

/**
 * Combined from/to date range picker showing two months. Emits both bounds as
 * wire-friendly "yyyy-MM-dd" strings (empty string when unset).
 */
export function DateRangePicker({
    from,
    to,
    onChange,
    placeholder = 'Select date range',
    className,
}: {
    from: string;
    to: string;
    onChange: (range: { from: string; to: string }) => void;
    placeholder?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);

    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    const selected: DateRange | undefined =
        fromDate || toDateValue
            ? { from: fromDate, to: toDateValue }
            : undefined;

    const label =
        fromDate && toDateValue
            ? `${format(fromDate, 'MMM d, yyyy')} – ${format(toDateValue, 'MMM d, yyyy')}`
            : fromDate
              ? `${format(fromDate, 'MMM d, yyyy')} – …`
              : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !fromDate && !toDateValue && 'text-muted-foreground',
                            className,
                        )}
                    />
                }
            >
                <CalendarIcon className="text-muted-foreground" />
                <span className="flex-1 truncate">{label}</span>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-3">
                <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={selected}
                    defaultMonth={fromDate ?? toDateValue}
                    onSelect={(range) =>
                        onChange({
                            from: range?.from
                                ? format(range.from, WIRE_FORMAT)
                                : '',
                            to: range?.to ? format(range.to, WIRE_FORMAT) : '',
                        })
                    }
                    autoFocus
                />
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange({ from: '', to: '' })}
                    >
                        Clear
                    </Button>
                    <Button size="sm" onClick={() => setOpen(false)}>
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
