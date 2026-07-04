import type { InertiaFormProps } from '@inertiajs/react';
import InputError from '@/components/input-error';
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
import type { Customer } from '@/types';
import type { AppointmentFormData } from './appointment-form';

type OptionCustomer = Pick<Customer, 'id' | 'full_name' | 'email' | 'phone'>;

export type CustomerMode = 'existing' | 'new';

export function CustomerFields({
    form,
    customers,
    mode,
    onModeChange,
}: {
    form: InertiaFormProps<AppointmentFormData>;
    customers: OptionCustomer[];
    mode: CustomerMode;
    onModeChange: (mode: CustomerMode) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant={mode === 'existing' ? 'default' : 'outline'}
                    onClick={() => onModeChange('existing')}
                    disabled={customers.length === 0}
                >
                    Existing
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={mode === 'new' ? 'default' : 'outline'}
                    onClick={() => onModeChange('new')}
                >
                    New customer
                </Button>
            </div>

            {mode === 'existing' ? (
                <div className="grid gap-2">
                    <Label>Customer</Label>
                    <Select
                        value={form.data.customer_id}
                        onValueChange={(v) =>
                            form.setData('customer_id', String(v))
                        }
                        items={Object.fromEntries(
                            customers.map((c) => [String(c.id), c.full_name]),
                        )}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
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
            )}
        </div>
    );
}
