import { Head, useForm } from '@inertiajs/react';
import { CalendarCheck, MapPin, Phone } from 'lucide-react';
import { useRef, useState } from 'react';
import { ContactFields } from '@/components/public/contact-fields';
import { TimeSlotGrid } from '@/components/public/time-slot-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { todayLocal } from '@/lib/format';
import { resourceSlots, resourceStore } from '@/routes/book';

type Props = {
    resources: { id: number; name: string }[];
    business: { phone: string | null; address: string | null };
    endpoints: {
        slots: string;
        store: string;
        resourceSlots: string;
        resourceStore: string;
    };
};

type BookingForm = {
    resource_id: string;
    appointment_date: string;
    start_time: string;
    duration: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    notes: string;
};

const DURATIONS: { value: string; label: string }[] = [
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '120 minutes' },
];

export default function ResourceBooking({
    resources,
    business,
    endpoints,
}: Props) {
    const form = useForm<BookingForm>({
        resource_id: '',
        appointment_date: '',
        start_time: '',
        duration: '60',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: '',
    });
    const { data, setData, errors } = form;

    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const requestId = useRef(0);

    const today = todayLocal();

    // Fetch open slots for an explicit resource/duration/date on user action.
    const loadSlots = (resourceId: string, duration: string, date: string) => {
        if (!duration || !date) {
            return;
        }

        const id = ++requestId.current;
        setLoadingSlots(true);

        const params = new URLSearchParams({ duration, date });

        if (resourceId) {
            params.set('resource_id', resourceId);
        }

        fetch(
            `${endpoints?.resourceSlots ?? resourceSlots().url}?${params.toString()}`,
            {
                headers: { Accept: 'application/json' },
            },
        )
            .then((r) => r.json())
            .then((body: { slots: string[] }) => {
                if (id === requestId.current) {
                    setSlots(body.slots ?? []);
                }
            })
            .catch(() => {
                if (id === requestId.current) {
                    setSlots([]);
                }
            })
            .finally(() => {
                if (id === requestId.current) {
                    setLoadingSlots(false);
                }
            });
    };

    const chooseDate = (date: string) => {
        setData((prev) => ({ ...prev, appointment_date: date, start_time: '' }));
        loadSlots(data.resource_id, data.duration, date);
    };

    const chooseDuration = (duration: string) => {
        setData((prev) => ({ ...prev, duration, start_time: '' }));
        loadSlots(data.resource_id, duration, data.appointment_date);
    };

    const chooseResource = (resourceId: string) => {
        setData((prev) => ({
            ...prev,
            resource_id: resourceId,
            start_time: '',
        }));
        loadSlots(resourceId, data.duration, data.appointment_date);
    };

    const canSubmit = Boolean(
        data.appointment_date &&
            data.start_time &&
            data.customer_name &&
            data.customer_phone,
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(endpoints?.resourceStore ?? resourceStore().url, {
            onError: (errs) => {
                if (errs.start_time || errs.appointment_date) {
                    // The chosen slot was taken/invalid — clear it and refresh
                    // the grid so the stale time can't be re-submitted.
                    setData('start_time', '');
                    loadSlots(
                        data.resource_id,
                        data.duration,
                        data.appointment_date,
                    );
                }
            },
        });
    };

    return (
        <>
            <Head title="Book a court" />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold">Book a court</h1>
                    <p className="text-sm text-muted-foreground">
                        Pick a date, duration and time that works for you.
                    </p>
                    {(business.phone || business.address) && (
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-sm text-muted-foreground">
                            {business.phone && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="size-4" />
                                    {business.phone}
                                </span>
                            )}
                            {business.address && (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-4" />
                                    {business.address}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Date &amp; time</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        min={today}
                                        value={data.appointment_date}
                                        onChange={(e) =>
                                            chooseDate(e.target.value)
                                        }
                                    />
                                    <InlineError
                                        message={errors.appointment_date}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Duration</Label>
                                    <Select
                                        value={data.duration}
                                        onValueChange={(v) =>
                                            chooseDuration(String(v))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DURATIONS.map((d) => (
                                                <SelectItem
                                                    key={d.value}
                                                    value={d.value}
                                                >
                                                    {d.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InlineError message={errors.duration} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Court</Label>
                                    <Select
                                        value={data.resource_id}
                                        onValueChange={(v) =>
                                            chooseResource(String(v))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Any available" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
                                                Any available
                                            </SelectItem>
                                            {resources.map((r) => (
                                                <SelectItem
                                                    key={r.id}
                                                    value={String(r.id)}
                                                >
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InlineError message={errors.resource_id} />
                                </div>
                            </div>

                            {data.appointment_date && (
                                <div className="space-y-2">
                                    <Label>Available times</Label>
                                    <TimeSlotGrid
                                        slots={slots}
                                        loading={loadingSlots}
                                        value={data.start_time}
                                        onSelect={(t) =>
                                            setData('start_time', t)
                                        }
                                    />
                                    <InlineError message={errors.start_time} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Your details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ContactFields
                                values={{
                                    customer_name: data.customer_name,
                                    customer_email: data.customer_email,
                                    customer_phone: data.customer_phone,
                                    notes: data.notes,
                                }}
                                errors={errors}
                                onChange={(field, value) =>
                                    setData(field, value)
                                }
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={!canSubmit || form.processing}
                        >
                            <CalendarCheck /> Confirm booking
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function InlineError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-sm text-destructive">{message}</p>;
}
