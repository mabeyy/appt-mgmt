import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
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
    Customer,
    Service,
    StatusOption,
    Staff,
} from '@/types';

type OptionService = Pick<Service, 'id' | 'name' | 'duration' | 'price'>;
type OptionStaff = Pick<Staff, 'id' | 'name'>;
type OptionCustomer = Pick<Customer, 'id' | 'full_name' | 'email' | 'phone'>;

export function AppointmentForm({
    appointment,
    services,
    staff,
    customers,
    statuses,
}: {
    appointment?: Appointment;
    services: OptionService[];
    staff: OptionStaff[];
    customers: OptionCustomer[];
    statuses: StatusOption[];
}) {
    const isEdit = Boolean(appointment);
    const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
        appointment?.customer_id
            ? 'existing'
            : customers.length > 0
              ? 'existing'
              : 'new',
    );

    const form = useForm({
        customer_id: appointment?.customer_id
            ? String(appointment.customer_id)
            : '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
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

    const serviceItems = useMemo(
        () => Object.fromEntries(services.map((s) => [String(s.id), s.name])),
        [services],
    );
    const staffItems = useMemo(
        () => ({
            '': 'Unassigned',
            ...Object.fromEntries(staff.map((s) => [String(s.id), s.name])),
        }),
        [staff],
    );
    const customerItems = useMemo(
        () =>
            Object.fromEntries(
                customers.map((c) => [String(c.id), c.full_name]),
            ),
        [customers],
    );
    const statusItems = useMemo(
        () => Object.fromEntries(statuses.map((s) => [s.value, s.label])),
        [statuses],
    );

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
            customer_id:
                customerMode === 'existing' && data.customer_id
                    ? Number(data.customer_id)
                    : null,
            customer_name: customerMode === 'new' ? data.customer_name : '',
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
                {/* Customer */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer</CardTitle>
                        <CardDescription>
                            Choose an existing customer or add a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={
                                    customerMode === 'existing'
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => setCustomerMode('existing')}
                                disabled={customers.length === 0}
                            >
                                Existing
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={
                                    customerMode === 'new'
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => setCustomerMode('new')}
                            >
                                New customer
                            </Button>
                        </div>

                        {customerMode === 'existing' ? (
                            <div className="grid gap-2">
                                <Label>Customer</Label>
                                <Select
                                    value={form.data.customer_id}
                                    onValueChange={(v) =>
                                        form.setData('customer_id', String(v))
                                    }
                                    items={customerItems}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {c.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.customer_id} />
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor="customer_name">
                                        Full name
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        value={form.data.customer_name}
                                        onChange={(e) =>
                                            form.setData(
                                                'customer_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.customer_name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_email">
                                        Email
                                    </Label>
                                    <Input
                                        id="customer_email"
                                        type="email"
                                        value={form.data.customer_email}
                                        onChange={(e) =>
                                            form.setData(
                                                'customer_email',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.customer_email}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_phone">
                                        Phone
                                    </Label>
                                    <Input
                                        id="customer_phone"
                                        value={form.data.customer_phone}
                                        onChange={(e) =>
                                            form.setData(
                                                'customer_phone',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.customer_phone}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Service</Label>
                            <Select
                                value={form.data.service_id}
                                onValueChange={onServiceChange}
                                items={serviceItems}
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
                                items={staffItems}
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
                            <Input
                                id="appointment_date"
                                type="date"
                                value={form.data.appointment_date}
                                onChange={(e) =>
                                    form.setData(
                                        'appointment_date',
                                        e.target.value,
                                    )
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
                            <InputError message={form.errors.duration} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar: status + notes + actions */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(v) =>
                                    form.setData(
                                        'status',
                                        String(v) as typeof form.data.status,
                                    )
                                }
                                items={statusItems}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                        >
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                rows={5}
                                placeholder="Optional notes..."
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
