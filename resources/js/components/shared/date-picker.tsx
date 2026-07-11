import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const WIRE_FORMAT = 'yyyy-MM-dd';

/**
 * Single-date picker built on the shadcn Calendar. Value is a wire-friendly
 * "yyyy-MM-dd" string (empty when unset).
 */
export function DatePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    disabled,
    id,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: (date: Date) => boolean;
    id?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const selected = value
        ? parse(value, WIRE_FORMAT, new Date())
        : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        id={id}
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !value && 'text-muted-foreground',
                            className,
                        )}
                    />
                }
            >
                <CalendarIcon className="text-muted-foreground" />
                <span className="flex-1 truncate">
                    {selected ? format(selected, 'MMM d, yyyy') : placeholder}
                </span>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-3">
                <Calendar
                    mode="single"
                    selected={selected}
                    defaultMonth={selected}
                    disabled={disabled}
                    onSelect={(date) => {
                        onChange(date ? format(date, WIRE_FORMAT) : '');
                        setOpen(false);
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
