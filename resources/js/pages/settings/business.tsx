import { Head, router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { CheckboxField } from '@/components/shared/checkbox-field';
import { WorkingDaysPicker } from '@/components/shared/working-days-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { edit, update } from '@/routes/business';
import { destroy as destroyClosedDate, store as storeClosedDate } from '@/routes/closed-dates';
import type { BusinessSettings } from '@/types';

type BusinessSettingsProps = BusinessSettings & {
    business_website?: string | null;
    business_city?: string | null;
    business_country?: string | null;
    currency?: string | null;
};

type ClosedDate = {
    id: number;
    date: string;
    reason: string | null;
};

const CURRENCIES = ['PHP', 'USD', 'EUR', 'GBP', 'AUD', 'SGD'];

const TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Manila',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
];

export default function BusinessSettings({
    settings,
    closedDates,
}: {
    settings: BusinessSettingsProps;
    closedDates: ClosedDate[];
}) {
    const timezones = TIMEZONES.includes(settings.timezone)
        ? TIMEZONES
        : [settings.timezone, ...TIMEZONES];

    const today = new Date().toISOString().slice(0, 10);

    const form = useForm({
        business_name: settings.business_name ?? '',
        business_email: settings.business_email ?? '',
        business_phone: settings.business_phone ?? '',
        business_address: settings.business_address ?? '',
        business_website: settings.business_website ?? '',
        business_city: settings.business_city ?? '',
        business_country: settings.business_country ?? '',
        currency: settings.currency ?? 'PHP',
        timezone: settings.timezone ?? 'UTC',
        business_hours_start: settings.business_hours_start ?? '09:00',
        business_hours_end: settings.business_hours_end ?? '18:00',
        working_days: settings.working_days ?? [],
        appointment_interval: settings.appointment_interval ?? 30,
        max_appointments_per_day: settings.max_appointments_per_day ?? 50,
        buffer_time: settings.buffer_time ?? 0,
        manual_approval: settings.manual_approval ?? true,
        logo: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(update().url, { forceFormData: true, preserveScroll: true });
    };

    const closedDateForm = useForm({
        date: '',
        reason: '',
    });

    const submitClosedDate = (e: React.FormEvent) => {
        e.preventDefault();
        closedDateForm.post(storeClosedDate().url, {
            preserveScroll: true,
            onSuccess: () => closedDateForm.reset(),
        });
    };

    const removeClosedDate = (id: number) => {
        router.delete(destroyClosedDate(id).url, { preserveScroll: true });
    };

    const formatClosedDate = (date: string) =>
        new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    return (
        <>
            <Head title="Business settings" />
            <h1 className="sr-only">Business settings</h1>

            <form onSubmit={submit} className="space-y-8">
                {/* General */}
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="General"
                        description="Your business identity and contact information"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="business_name">Business name</Label>
                            <Input
                                id="business_name"
                                value={form.data.business_name}
                                onChange={(e) =>
                                    form.setData(
                                        'business_name',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.business_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_email">Email</Label>
                            <Input
                                id="business_email"
                                type="email"
                                value={form.data.business_email}
                                onChange={(e) =>
                                    form.setData(
                                        'business_email',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.business_email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_phone">Phone</Label>
                            <Input
                                id="business_phone"
                                value={form.data.business_phone}
                                onChange={(e) =>
                                    form.setData(
                                        'business_phone',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.business_phone} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="business_address">Address</Label>
                            <Input
                                id="business_address"
                                value={form.data.business_address}
                                onChange={(e) =>
                                    form.setData(
                                        'business_address',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.business_address}
                            />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="business_website">Website</Label>
                            <Input
                                id="business_website"
                                type="url"
                                placeholder="https://example.com"
                                value={form.data.business_website}
                                onChange={(e) =>
                                    form.setData(
                                        'business_website',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.business_website}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_city">City</Label>
                            <Input
                                id="business_city"
                                value={form.data.business_city}
                                onChange={(e) =>
                                    form.setData(
                                        'business_city',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.business_city} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_country">Country</Label>
                            <Input
                                id="business_country"
                                value={form.data.business_country}
                                onChange={(e) =>
                                    form.setData(
                                        'business_country',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.business_country}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                                value={form.data.currency}
                                onValueChange={(v) =>
                                    form.setData('currency', String(v))
                                }
                                items={Object.fromEntries(
                                    CURRENCIES.map((c) => [c, c]),
                                )}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.currency} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="timezone">Time zone</Label>
                            <Select
                                value={form.data.timezone}
                                onValueChange={(v) =>
                                    form.setData('timezone', String(v))
                                }
                                items={Object.fromEntries(
                                    timezones.map((t) => [t, t]),
                                )}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezones.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.timezone} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logo">Business logo</Label>
                            <div className="flex items-center gap-3">
                                {settings.business_logo && (
                                    <img
                                        src={settings.business_logo}
                                        alt="Logo"
                                        className="size-10 rounded-md object-cover"
                                    />
                                )}
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        form.setData(
                                            'logo',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </div>
                            <InputError message={form.errors.logo} />
                        </div>
                    </div>
                </div>

                {/* Appointment settings */}
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Appointment settings"
                        description="Control availability and booking behavior"
                    />

                    <WorkingDaysPicker
                        value={form.data.working_days}
                        onChange={(days) => form.setData('working_days', days)}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="business_hours_start">
                                Business hours start
                            </Label>
                            <Input
                                id="business_hours_start"
                                type="time"
                                value={form.data.business_hours_start}
                                onChange={(e) =>
                                    form.setData(
                                        'business_hours_start',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.business_hours_start}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_hours_end">
                                Business hours end
                            </Label>
                            <Input
                                id="business_hours_end"
                                type="time"
                                value={form.data.business_hours_end}
                                onChange={(e) =>
                                    form.setData(
                                        'business_hours_end',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.business_hours_end}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="appointment_interval">
                                Appointment interval (min)
                            </Label>
                            <Input
                                id="appointment_interval"
                                type="number"
                                min={5}
                                value={form.data.appointment_interval}
                                onChange={(e) =>
                                    form.setData(
                                        'appointment_interval',
                                        Number(e.target.value),
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.appointment_interval}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="buffer_time">
                                Buffer between appointments (min)
                            </Label>
                            <Input
                                id="buffer_time"
                                type="number"
                                min={0}
                                value={form.data.buffer_time}
                                onChange={(e) =>
                                    form.setData(
                                        'buffer_time',
                                        Number(e.target.value),
                                    )
                                }
                            />
                            <InputError message={form.errors.buffer_time} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max_appointments_per_day">
                                Max appointments per day
                            </Label>
                            <Input
                                id="max_appointments_per_day"
                                type="number"
                                min={1}
                                value={form.data.max_appointments_per_day}
                                onChange={(e) =>
                                    form.setData(
                                        'max_appointments_per_day',
                                        Number(e.target.value),
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.max_appointments_per_day}
                            />
                        </div>
                    </div>

                    <CheckboxField
                        checked={form.data.manual_approval}
                        onCheckedChange={(checked) =>
                            form.setData('manual_approval', checked)
                        }
                        label="Require manual approval for new appointments"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={form.processing}>
                        Save settings
                    </Button>
                    {form.recentlySuccessful && (
                        <span className="text-sm text-muted-foreground">
                            Saved.
                        </span>
                    )}
                </div>
            </form>

            {/* Closed dates */}
            <div className="mt-8 space-y-6">
                <Heading
                    variant="small"
                    title="Closed dates"
                    description="Holidays and special closures when bookings are unavailable"
                />

                <form
                    onSubmit={submitClosedDate}
                    className="flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="closed_date">Date</Label>
                        <Input
                            id="closed_date"
                            type="date"
                            min={today}
                            value={closedDateForm.data.date}
                            onChange={(e) =>
                                closedDateForm.setData('date', e.target.value)
                            }
                        />
                        <InputError message={closedDateForm.errors.date} />
                    </div>
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="closed_reason">Reason (optional)</Label>
                        <Input
                            id="closed_reason"
                            placeholder="e.g. Public holiday"
                            value={closedDateForm.data.reason}
                            onChange={(e) =>
                                closedDateForm.setData('reason', e.target.value)
                            }
                        />
                        <InputError message={closedDateForm.errors.reason} />
                    </div>
                    <Button
                        type="submit"
                        variant="secondary"
                        disabled={
                            closedDateForm.processing || !closedDateForm.data.date
                        }
                    >
                        Add
                    </Button>
                </form>

                {closedDates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No closed dates.
                    </p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {closedDates.map((closedDate) => (
                            <li
                                key={closedDate.id}
                                className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        {formatClosedDate(closedDate.date)}
                                    </p>
                                    {closedDate.reason && (
                                        <p className="truncate text-sm text-muted-foreground">
                                            {closedDate.reason}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        removeClosedDate(closedDate.id)
                                    }
                                    aria-label="Remove closed date"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

BusinessSettings.layout = {
    breadcrumbs: [{ title: 'Business settings', href: edit() }],
};
