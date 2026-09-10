import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2, CalendarCheck, LogIn, Plus, Power, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import platform from '@/routes/platform';

type TypeOption = { value: string; label: string };

type Tenant = {
    id: number;
    name: string;
    slug: string;
    type: string;
    typeLabel: string;
    isActive: boolean;
    usersCount: number;
    bookingsCount: number;
    customersCount: number;
    createdAt: string | null;
};

type Props = {
    tenants: Tenant[];
    businessTypes: TypeOption[];
    stats: {
        tenants: number;
        active: number;
        users: number;
        bookings: number;
        customers: number;
    };
};

export default function PlatformDashboard({ tenants, businessTypes, stats }: Props) {
    const [creating, setCreating] = useState(false);
    const form = useForm({
        name: '',
        type: businessTypes[0]?.value ?? 'salon',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(platform.tenants.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setCreating(false);
            },
        });
    }

    return (
        <>
            <Head title="Platform" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 md:p-8">
                <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="size-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Platform console</h1>
                            <p className="text-muted-foreground">Every business on the platform.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/platform/audit"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50"
                        >
                            Audit log
                        </Link>
                        <button
                            type="button"
                            onClick={() => setCreating((v) => !v)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <Plus className="size-4" /> New tenant
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <Stat label="Tenants" value={stats.tenants} icon={Building2} />
                    <Stat label="Active" value={stats.active} icon={Power} />
                    <Stat label="Users" value={stats.users} icon={Users} />
                    <Stat label="Bookings" value={stats.bookings} icon={CalendarCheck} />
                    <Stat label="Customers" value={stats.customers} icon={Users} />
                </div>

                {creating && (
                    <form
                        onSubmit={submit}
                        className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"
                    >
                        <Field label="Business name" error={form.errors.name}>
                            <input
                                className="w-full rounded-lg border border-border bg-background p-2"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                        </Field>
                        <Field label="Type" error={form.errors.type}>
                            <select
                                className="w-full rounded-lg border border-border bg-background p-2"
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value)}
                            >
                                {businessTypes.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Owner name" error={form.errors.owner_name}>
                            <input
                                className="w-full rounded-lg border border-border bg-background p-2"
                                value={form.data.owner_name}
                                onChange={(e) => form.setData('owner_name', e.target.value)}
                            />
                        </Field>
                        <Field label="Owner email" error={form.errors.owner_email}>
                            <input
                                type="email"
                                className="w-full rounded-lg border border-border bg-background p-2"
                                value={form.data.owner_email}
                                onChange={(e) => form.setData('owner_email', e.target.value)}
                            />
                        </Field>
                        <Field label="Owner password" error={form.errors.owner_password}>
                            <input
                                type="password"
                                className="w-full rounded-lg border border-border bg-background p-2"
                                value={form.data.owner_password}
                                onChange={(e) => form.setData('owner_password', e.target.value)}
                            />
                        </Field>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                            >
                                Create tenant
                            </button>
                        </div>
                    </form>
                )}

                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">Business</th>
                                <th className="p-3 font-medium">Type</th>
                                <th className="p-3 text-right font-medium">Bookings</th>
                                <th className="p-3 text-right font-medium">Customers</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id}>
                                    <td className="p-3">
                                        <p className="font-medium">{tenant.name}</p>
                                        <span className="text-xs text-muted-foreground">/{tenant.slug}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{tenant.typeLabel}</span>
                                    </td>
                                    <td className="p-3 text-right tabular-nums">{tenant.bookingsCount}</td>
                                    <td className="p-3 text-right tabular-nums">{tenant.customersCount}</td>
                                    <td className="p-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.patch(platform.tenants.toggle(tenant.slug).url, {}, { preserveScroll: true })
                                            }
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                tenant.isActive
                                                    ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {tenant.isActive ? 'Active' : 'Suspended'}
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => router.post(platform.tenants.enter(tenant.slug).url)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                                        >
                                            <LogIn className="size-3.5" /> Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                        No tenants yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                    Sign out via the tenant panel →
                </Link>
            </div>
        </>
    );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Building2 }) {
    return (
        <div className="rounded-xl border border-border p-4">
            <Icon className="size-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {children}
            {error && <span className="text-sm text-destructive">{error}</span>}
        </label>
    );
}
