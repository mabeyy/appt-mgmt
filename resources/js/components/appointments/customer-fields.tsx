import type { InertiaFormProps } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AppointmentFormData } from './appointment-form';

export function CustomerFields({
    form,
}: {
    form: InertiaFormProps<AppointmentFormData>;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="customer_name">Full name</Label>
                <Input
                    id="customer_name"
                    value={form.data.customer_name}
                    onChange={(e) =>
                        form.setData('customer_name', e.target.value)
                    }
                />
                <InputError message={form.errors.customer_name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                    id="customer_email"
                    type="email"
                    value={form.data.customer_email}
                    onChange={(e) =>
                        form.setData('customer_email', e.target.value)
                    }
                />
                <InputError message={form.errors.customer_email} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                    id="customer_phone"
                    value={form.data.customer_phone}
                    onChange={(e) =>
                        form.setData('customer_phone', e.target.value)
                    }
                />
                <InputError message={form.errors.customer_phone} />
            </div>
        </div>
    );
}
