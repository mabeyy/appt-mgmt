import { Head, useForm } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

type TypeOption = { value: string; label: string };

type Props = { types: TypeOption[] };

export default function Onboarding({ types }: Props) {
    const form = useForm({
        business_name: '',
        business_type: types[0]?.value ?? 'salon',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/get-started');
    }

    return (
        <>
            <Head title="Get started" />
            <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 p-6">
                <header className="text-center">
                    <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="size-6" />
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight">Set up your business</h1>
                    <p className="text-muted-foreground">A booking page and dashboard in under a minute.</p>
                </header>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <Field label="Business name" error={form.errors.business_name}>
                        <input
                            className="w-full rounded-lg border border-border bg-background p-2.5"
                            value={form.data.business_name}
                            onChange={(e) => form.setData('business_name', e.target.value)}
                            placeholder="e.g. Glow Salon"
                        />
                    </Field>

                    <Field label="What type of business?" error={form.errors.business_type}>
                        <select
                            className="w-full rounded-lg border border-border bg-background p-2.5"
                            value={form.data.business_type}
                            onChange={(e) => form.setData('business_type', e.target.value)}
                        >
                            {types.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <hr className="border-border" />

                    <Field label="Your name" error={form.errors.name}>
                        <input
                            className="w-full rounded-lg border border-border bg-background p-2.5"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                    </Field>

                    <Field label="Email" error={form.errors.email}>
                        <input
                            type="email"
                            className="w-full rounded-lg border border-border bg-background p-2.5"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                        />
                    </Field>

                    <Field label="Password" error={form.errors.password}>
                        <input
                            type="password"
                            className="w-full rounded-lg border border-border bg-background p-2.5"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                    </Field>

                    <Field label="Confirm password">
                        <input
                            type="password"
                            className="w-full rounded-lg border border-border bg-background p-2.5"
                            value={form.data.password_confirmation}
                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                        />
                    </Field>

                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg bg-primary p-3 font-medium text-primary-foreground disabled:opacity-50"
                    >
                        {form.processing ? 'Creating…' : 'Create my business'}
                    </button>
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {children}
            {error && <span className="text-sm text-destructive">{error}</span>}
        </label>
    );
}
