import { useForm } from '@inertiajs/react';
import { CalendarClock, ClipboardList, User } from 'lucide-react';
import { CustomerFields } from '@/components/appointments/customer-fields';
import InputError from '@/components/input-error';
import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/appointments';
import type {
    Appointment,
    AppointmentStatusValue,
    Service,
    StatusOption,
    Staff,
} from '@/types';

type OptionService = Pick<Service, 'id' | 'name' | 'duration' | 'price'>;
type OptionStaff = Pick<Staff, 'id' | 'name'>;

export type AppointmentFormData = {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_id: string;
    staff_id: string;
    appointment_date: string;
    start_time: string;
    duration: number;
    status: AppointmentStatusValue;
    notes: string;
};

export function AppointmentForm({
    appointment,
    services,
    staff,
    statuses,
}: {
    appointment?: Appointment;
    services: OptionService[];
    staff: OptionStaff[];
    statuses: StatusOption[];
}) {
    const isEdit = Boolean(appointment);

    const form = useForm<AppointmentFormData>({
        customer_name: appointment?.customer?.full_name ?? '',
        customer_email: appointment?.customer?.email ?? '',
        customer_phone: appointment?.customer?.phone ?? '',
        service_id: appointment?.service_id
            ? String(appointment.service_id)
            : '',
        staff_id: appointment?.staff_id ? String(appointment.staff_id) : '',
        appointment_date:
            appointment?.appointment_date?.slice(0, 10) ??
            new Date().toISOString().slice(0, 10),
        start_time: appointment?.start_time?.slice(0, 5) ?? '09:00',
        duration: appointment?.duration ?? 30,
        status: appointment?.status ?? 'pending',
        notes: appointment?.notes ?? '',
    });

    const onServiceChange = (value: string | null) => {
        const next = value ?? '';
        form.setData('service_id', next);
        const svc = services.find((s) => String(s.id) === next);

        if (svc && !isEdit) {
            form.setData('duration', svc.duration);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            service_id: data.service_id ? Number(data.service_id) : null,
            staff_id: data.staff_id ? Number(data.staff_id) : null,
            duration: Number(data.duration),
        }));

        if (isEdit && appointment) {
            form.put(update(appointment.id).url);
        } else {
            form.post(store().url);
        }
    };

    return (
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-4 text-muted-foreground" />
                            Customer
                        </CardTitle>
                        <CardDescription>
                            Enter the customer's contact details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomerFields form={form} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarClock className="size-4 text-muted-foreground" />
                            Schedule
                        </CardTitle>
                        <CardDescription>
                            Choose the service, date, and time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Service</Label>
                            <Select
                                value={form.data.service_id}
                                onValueChange={onServiceChange}
                                items={Object.fromEntries(
                                    services.map((s) => [String(s.id), s.name]),
                                )}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map((s) => (
                                        <SelectItem
                                            key={s.id}
                                            value={String(s.id)}
                                        >
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.service_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Staff (optional)</Label>
                            <Select
                                value={form.data.staff_id}
                                onValueChange={(v) =>
                                    form.setData('staff_id', String(v))
                                }
                                items={{
                                    '': 'Unassigned',
                                    ...Object.fromEntries(
                                        staff.map((s) => [
                                            String(s.id),
                                            s.name,
                                        ]),
                                    ),
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Unassigned</SelectItem>
                                    {staff.map((s) => (
                                        <SelectItem
                                            key={s.id}
                                            value={String(s.id)}
                                        >
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.staff_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="appointment_date">Date</Label>
                            <DatePicker
                                id="appointment_date"
                                value={form.data.appointment_date}
                                onChange={(v) =>
                                    form.setData('appointment_date', v)
                                }
                                disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                }
                            />
                            <InputError
                                message={form.errors.appointment_date}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="start_time">Time</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={form.data.start_time}
                                onChange={(e) =>
                                    form.setData('start_time', e.target.value)
                                }
                            />
                            <InputError message={form.errors.start_time} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min={5}
                                value={form.data.duration}
                                onChange={(e) =>
                                    form.setData(
                                        'duration',
                                        Number(e.target.value),
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Auto-filled from the service; adjust if needed.
                            </p>
                            <InputError message={form.errors.duration} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6 lg:h-full">
                <Card className="lg:h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="size-4 text-muted-foreground" />
                            Details
                        </CardTitle>
                        <CardDescription>
                            Set the status and any notes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(v) =>
                                    form.setData(
                                        'status',
                                        String(v) as AppointmentStatusValue,
                                    )
                                }
                                items={Object.fromEntries(
                                    statuses.map((s) => [s.value, s.label]),
                                )}
                            >
                                <SelectTrigger className="w-full">
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: statuses.find(
                                                    (s) =>
                                                        s.value ===
                                                        form.data.status,
                                                )?.color,
                                            }}
                                        />
                                        <SelectValue placeholder="Status" />
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="size-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            s.color,
                                                    }}
                                                />
                                                {s.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                rows={5}
                                placeholder="Optional notes..."
                                className="min-h-24 flex-1 resize-none"
                            />
                            <InputError message={form.errors.notes} />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {isEdit ? 'Save changes' : 'Create appointment'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}
