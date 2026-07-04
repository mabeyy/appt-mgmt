import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { edit, update } from '@/routes/business';
import type { BusinessSettings } from '@/types';

const DAYS = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
];

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

export default function BusinessSettings({ settings }: { settings: BusinessSettings }) {
    const timezones = TIMEZONES.includes(settings.timezone)
        ? TIMEZONES
        : [settings.timezone, ...TIMEZONES];

    const form = useForm({
        business_name: settings.business_name ?? '',
        business_email: settings.business_email ?? '',
        business_phone: settings.business_phone ?? '',
        business_address: settings.business_address ?? '',
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

    const toggleDay = (day: string) =>
        form.setData(
            'working_days',
            form.data.working_days.includes(day)
                ? form.data.working_days.filter((d) => d !== day)
                : [...form.data.working_days, day],
        );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(update().url, { forceFormData: true, preserveScroll: true });
    };

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
                                onChange={(e) => form.setData('business_name', e.target.value)}
                            />
                            <InputError message={form.errors.business_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_email">Email</Label>
                            <Input
                                id="business_email"
                                type="email"
                                value={form.data.business_email}
                                onChange={(e) => form.setData('business_email', e.target.value)}
                            />
                            <InputError message={form.errors.business_email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_phone">Phone</Label>
                            <Input
                                id="business_phone"
                                value={form.data.business_phone}
                                onChange={(e) => form.setData('business_phone', e.target.value)}
                            />
                            <InputError message={form.errors.business_phone} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="business_address">Address</Label>
                            <Input
                                id="business_address"
                                value={form.data.business_address}
                                onChange={(e) => form.setData('business_address', e.target.value)}
                            />
                            <InputError message={form.errors.business_address} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="timezone">Time zone</Label>
                            <Select
                                value={form.data.timezone}
                                onValueChange={(v) => form.setData('timezone', String(v))}
                                items={Object.fromEntries(timezones.map((t) => [t, t]))}
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
                                    onChange={(e) => form.setData('logo', e.target.files?.[0] ?? null)}
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

                    <div className="grid gap-2">
                        <Label>Working days</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {DAYS.map((day) => {
                                const active = form.data.working_days.includes(day.key);
                                return (
                                    <button
                                        key={day.key}
                                        type="button"
                                        onClick={() => toggleDay(day.key)}
                                        className={cn(
                                            'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                                            active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-input hover:bg-muted',
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="business_hours_start">Business hours start</Label>
                            <Input
                                id="business_hours_start"
                                type="time"
                                value={form.data.business_hours_start}
                                onChange={(e) => form.setData('business_hours_start', e.target.value)}
                            />
                            <InputError message={form.errors.business_hours_start} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="business_hours_end">Business hours end</Label>
                            <Input
                                id="business_hours_end"
                                type="time"
                                value={form.data.business_hours_end}
                                onChange={(e) => form.setData('business_hours_end', e.target.value)}
                            />
                            <InputError message={form.errors.business_hours_end} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="appointment_interval">Appointment interval (min)</Label>
                            <Input
                                id="appointment_interval"
                                type="number"
                                min={5}
                                value={form.data.appointment_interval}
                                onChange={(e) => form.setData('appointment_interval', Number(e.target.value))}
                            />
                            <InputError message={form.errors.appointment_interval} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="buffer_time">Buffer between appointments (min)</Label>
                            <Input
                                id="buffer_time"
                                type="number"
                                min={0}
                                value={form.data.buffer_time}
                                onChange={(e) => form.setData('buffer_time', Number(e.target.value))}
                            />
                            <InputError message={form.errors.buffer_time} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max_appointments_per_day">Max appointments per day</Label>
                            <Input
                                id="max_appointments_per_day"
                                type="number"
                                min={1}
                                value={form.data.max_appointments_per_day}
                                onChange={(e) => form.setData('max_appointments_per_day', Number(e.target.value))}
                            />
                            <InputError message={form.errors.max_appointments_per_day} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2.5">
                        <Checkbox
                            checked={form.data.manual_approval}
                            onCheckedChange={(checked) => form.setData('manual_approval', checked === true)}
                        />
                        <span className="text-sm">
                            Require manual approval for new appointments
                        </span>
                    </label>
                </div>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={form.processing}>
                        Save settings
                    </Button>
                    {form.recentlySuccessful && (
                        <span className="text-sm text-muted-foreground">Saved.</span>
                    )}
                </div>
            </form>
        </>
    );
}

BusinessSettings.layout = {
    breadcrumbs: [{ title: 'Business settings', href: edit() }],
};
