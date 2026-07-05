import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { BookingStepper } from '@/components/public/booking-stepper';
import { ServicePicker } from '@/components/public/service-picker';
import { TimeSlotGrid } from '@/components/public/time-slot-grid';
import type {
    BookingGroup,
    BookingService,
    BookingStaff,
} from '@/components/public/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { slots as slotsRoute, store } from '@/routes/book';

type Props = {
    serviceGroups: BookingGroup[];
    staff: BookingStaff[];
    business: { phone: string | null; address: string | null };
};

const STEPS = ['Service', 'Staff', 'Date & time', 'Your details', 'Confirm'];

type BookingForm = {
    service_id: string;
    staff_id: string;
    appointment_date: string;
    start_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    notes: string;
};

export default function Booking({ serviceGroups, staff }: Props) {
    const form = useForm<BookingForm>({
        service_id: '',
        staff_id: '',
        appointment_date: '',
        start_time: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: '',
    });
    const { data, setData, errors } = form;

    const [step, setStep] = useState(0);
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const requestId = useRef(0);

    const services = serviceGroups.flatMap((g) => g.services);
    const selectedService =
        services.find((s) => String(s.id) === data.service_id) ?? null;
    const selectedStaff =
        staff.find((s) => String(s.id) === data.staff_id) ?? null;
    const today = new Date().toISOString().slice(0, 10);

    // Fetch open slots for an explicit service/staff/date on user action.
    const loadSlots = (serviceId: string, staffId: string, date: string) => {
        if (!serviceId || !date) {
            return;
        }

        const id = ++requestId.current;
        setLoadingSlots(true);

        const params = new URLSearchParams({ service_id: serviceId, date });

        if (staffId) {
            params.set('staff_id', staffId);
        }

        fetch(`${slotsRoute().url}?${params.toString()}`, {
            headers: { Accept: 'application/json' },
        })
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

    // Changing the service resets the later choices so slots are always fresh.
    const chooseService = (service: BookingService) => {
        setData((prev) => ({
            ...prev,
            service_id: String(service.id),
            appointment_date: '',
            start_time: '',
        }));
        setSlots([]);
        setStep(1);
    };

    const chooseStaff = (staffId: string) => {
        setData((prev) => ({ ...prev, staff_id: staffId, start_time: '' }));
        loadSlots(data.service_id, staffId, data.appointment_date);
    };

    const chooseDate = (date: string) => {
        setData((prev) => ({
            ...prev,
            appointment_date: date,
            start_time: '',
        }));
        loadSlots(data.service_id, data.staff_id, date);
    };

    const canAdvance = [
        Boolean(data.service_id),
        true,
        Boolean(data.appointment_date && data.start_time),
        Boolean(
            data.customer_name && data.customer_email && data.customer_phone,
        ),
        true,
    ][step];

    const submit = () => {
        form.post(store().url, {
            onError: (e) => {
                if (e.service_id) {
                    setStep(0);
                } else if (e.staff_id) {
                    setStep(1);
                } else if (e.appointment_date || e.start_time) {
                    setStep(2);
                } else if (
                    e.customer_name ||
                    e.customer_email ||
                    e.customer_phone
                ) {
                    setStep(3);
                }
            },
        });
    };

    return (
        <>
            <Head title="Book an appointment" />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold">
                        Book an appointment
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Choose a service and a time that works for you.
                    </p>
                </div>

                <div className="flex justify-center">
                    <BookingStepper steps={STEPS} current={step} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{STEPS[step]}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {step === 0 && (
                            <ServicePicker
                                groups={serviceGroups}
                                value={data.service_id}
                                onSelect={chooseService}
                            />
                        )}

                        {step === 1 && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => chooseStaff('')}
                                    className={cn(
                                        'rounded-lg border p-4 text-left transition-colors hover:border-primary/60',
                                        data.staff_id === ''
                                            ? 'border-primary ring-1 ring-primary'
                                            : 'border-input',
                                    )}
                                >
                                    <span className="font-medium">
                                        Any available
                                    </span>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        We'll assign the first free staff
                                        member.
                                    </p>
                                </button>
                                {staff.map((member) => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() =>
                                            chooseStaff(String(member.id))
                                        }
                                        className={cn(
                                            'rounded-lg border p-4 text-left transition-colors hover:border-primary/60',
                                            data.staff_id === String(member.id)
                                                ? 'border-primary ring-1 ring-primary'
                                                : 'border-input',
                                        )}
                                    >
                                        <span className="font-medium">
                                            {member.name}
                                        </span>
                                        {member.position && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {member.position}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
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
                                        className="max-w-xs"
                                    />
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
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="customer_name">
                                        Full name
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        value={data.customer_name}
                                        onChange={(e) =>
                                            setData(
                                                'customer_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.customer_name && (
                                        <p className="text-sm text-destructive">
                                            {errors.customer_name}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="customer_email">
                                            Email
                                        </Label>
                                        <Input
                                            id="customer_email"
                                            type="email"
                                            value={data.customer_email}
                                            onChange={(e) =>
                                                setData(
                                                    'customer_email',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.customer_email && (
                                            <p className="text-sm text-destructive">
                                                {errors.customer_email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="customer_phone">
                                            Phone
                                        </Label>
                                        <Input
                                            id="customer_phone"
                                            value={data.customer_phone}
                                            onChange={(e) =>
                                                setData(
                                                    'customer_phone',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.customer_phone && (
                                            <p className="text-sm text-destructive">
                                                {errors.customer_phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="notes">
                                        Notes (optional)
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        rows={3}
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        placeholder="Anything we should know?"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <dl className="divide-y text-sm">
                                <SummaryRow
                                    label="Service"
                                    value={
                                        selectedService
                                            ? `${selectedService.name} · ${formatDuration(selectedService.duration)} · ${formatCurrency(selectedService.price)}`
                                            : '—'
                                    }
                                />
                                <SummaryRow
                                    label="Staff"
                                    value={
                                        selectedStaff?.name ?? 'Any available'
                                    }
                                />
                                <SummaryRow
                                    label="Date"
                                    value={
                                        data.appointment_date
                                            ? formatDate(data.appointment_date)
                                            : '—'
                                    }
                                />
                                <SummaryRow
                                    label="Time"
                                    value={data.start_time || '—'}
                                />
                                <SummaryRow
                                    label="Name"
                                    value={data.customer_name}
                                />
                                <SummaryRow
                                    label="Email"
                                    value={data.customer_email}
                                />
                                <SummaryRow
                                    label="Phone"
                                    value={data.customer_phone}
                                />
                                {(errors.start_time ||
                                    errors.appointment_date ||
                                    errors.staff_id) && (
                                    <p className="pt-3 text-sm text-destructive">
                                        {errors.start_time ??
                                            errors.appointment_date ??
                                            errors.staff_id}
                                    </p>
                                )}
                            </dl>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        disabled={step === 0}
                    >
                        <ArrowLeft /> Back
                    </Button>
                    {step < STEPS.length - 1 ? (
                        <Button
                            onClick={() => setStep((s) => s + 1)}
                            disabled={!canAdvance}
                        >
                            Next <ArrowRight />
                        </Button>
                    ) : (
                        <Button onClick={submit} disabled={form.processing}>
                            <CalendarCheck /> Confirm booking
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
        </div>
    );
}
