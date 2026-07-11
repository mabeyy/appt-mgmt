import { X } from 'lucide-react';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Service, StatusOption, Staff } from '@/types';

export type AppointmentFiltersState = {
    search: string;
    status: string;
    service_id: string;
    staff_id: string;
    date_from: string;
    date_to: string;
    sort: string;
    direction: string;
};

export function AppointmentFilters({
    values,
    setValue,
    reset,
    hasFilters,
    services,
    staff,
    statuses,
}: {
    values: AppointmentFiltersState;
    setValue: (key: keyof AppointmentFiltersState, value: string) => void;
    reset: () => void;
    hasFilters: boolean;
    services: Pick<Service, 'id' | 'name'>[];
    staff: Pick<Staff, 'id' | 'name'>[];
    statuses: StatusOption[];
}) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <SearchInput
                    value={values.search}
                    onChange={(v) => setValue('search', v)}
                    placeholder="Search # or customer..."
                    className="sm:col-span-2"
                />

                <Select
                    value={values.status}
                    onValueChange={(v) => setValue('status', String(v))}
                    items={{
                        all: 'All statuses',
                        ...Object.fromEntries(
                            statuses.map((s) => [s.value, s.label]),
                        ),
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={values.service_id}
                    onValueChange={(v) => setValue('service_id', String(v))}
                    items={{
                        all: 'All services',
                        ...Object.fromEntries(
                            services.map((s) => [String(s.id), s.name]),
                        ),
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All services</SelectItem>
                        {services.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={values.staff_id}
                    onValueChange={(v) => setValue('staff_id', String(v))}
                    items={{
                        all: 'All staff',
                        ...Object.fromEntries(
                            staff.map((s) => [String(s.id), s.name]),
                        ),
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All staff</SelectItem>
                        {staff.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DateRangePicker
                    from={values.date_from}
                    to={values.date_to}
                    onChange={({ from, to }) => {
                        setValue('date_from', from);
                        setValue('date_to', to);
                    }}
                    placeholder="Date range"
                />
            </div>

            {hasFilters && (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={reset}>
                        <X /> Clear filters
                    </Button>
                </div>
            )}
        </div>
    );
}
