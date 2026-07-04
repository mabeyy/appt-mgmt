import type { EventInput, EventSourceFuncArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { show } from '@/routes/appointments';
import { events as eventsRoute, reschedule } from '@/routes/calendar';
import { index } from '@/routes/calendar';
import type { Service, Staff } from '@/types';

type Props = {
    services: Pick<Service, 'id' | 'name'>[];
    staff: Pick<Staff, 'id' | 'name'>[];
};

const LEGEND = [
    { label: 'Pending', color: '#f59e0b' },
    { label: 'Confirmed', color: '#3b82f6' },
    { label: 'Completed', color: '#22c55e' },
    { label: 'Cancelled', color: '#ef4444' },
    { label: 'No Show', color: '#6b7280' },
];

export default function CalendarPage({ services, staff }: Props) {
    const calendarRef = useRef<FullCalendar>(null);
    const [serviceId, setServiceId] = useState('all');
    const [staffId, setStaffId] = useState('all');

    const refetch = () => calendarRef.current?.getApi().refetchEvents();

    const fetchEvents = (
        info: EventSourceFuncArg,
        success: (events: EventInput[]) => void,
        failure: (error: Error) => void,
    ) => {
        const params = new URLSearchParams({
            start: info.startStr,
            end: info.endStr,
        });

        if (serviceId !== 'all') {
            params.set('service_id', serviceId);
        }

        if (staffId !== 'all') {
            params.set('staff_id', staffId);
        }

        fetch(`${eventsRoute().url}?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((res) => res.json())
            .then((data: EventInput[]) => success(data))
            .catch(failure);
    };

    return (
        <>
            <Head title="Calendar" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Calendar"
                    description="Drag an appointment to reschedule it."
                >
                    <Select
                        value={serviceId}
                        onValueChange={(v) => {
                            setServiceId(String(v));
                            requestAnimationFrame(refetch);
                        }}
                        items={{
                            all: 'All services',
                            ...Object.fromEntries(
                                services.map((s) => [String(s.id), s.name]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-40">
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
                        value={staffId}
                        onValueChange={(v) => {
                            setStaffId(String(v));
                            requestAnimationFrame(refetch);
                        }}
                        items={{
                            all: 'All staff',
                            ...Object.fromEntries(
                                staff.map((s) => [String(s.id), s.name]),
                            ),
                        }}
                    >
                        <SelectTrigger className="w-40">
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
                </PageHeader>

                <div className="flex flex-wrap items-center gap-4">
                    {LEGEND.map((l) => (
                        <span
                            key={l.label}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                            <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: l.color }}
                            />
                            {l.label}
                        </span>
                    ))}
                </div>

                <Card>
                    <CardContent className="p-3 md:p-4">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[
                                dayGridPlugin,
                                timeGridPlugin,
                                interactionPlugin,
                            ]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            height="auto"
                            editable
                            eventDurationEditable={false}
                            dayMaxEvents={3}
                            nowIndicator
                            events={fetchEvents}
                            eventDrop={(arg) => {
                                const start = arg.event.start;

                                if (!start) {
                                    arg.revert();

                                    return;
                                }

                                const pad = (n: number) =>
                                    String(n).padStart(2, '0');
                                const appointment_date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
                                const start_time = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
                                router.patch(
                                    reschedule(Number(arg.event.id)).url,
                                    { appointment_date, start_time },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                        onError: () => arg.revert(),
                                    },
                                );
                            }}
                            eventClick={(arg) => {
                                arg.jsEvent.preventDefault();
                                router.visit(show(Number(arg.event.id)).url);
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CalendarPage.layout = {
    breadcrumbs: [{ title: 'Calendar', href: index() }],
};
