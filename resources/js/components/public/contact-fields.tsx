import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type ContactField =
    'customer_name' | 'customer_email' | 'customer_phone' | 'notes';

type ContactValues = Record<ContactField, string>;
type ContactErrors = Partial<Record<ContactField, string>>;

export function ContactFields({
    values,
    errors,
    onChange,
}: {
    values: ContactValues;
    errors: ContactErrors;
    onChange: (field: ContactField, value: string) => void;
}) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-1.5">
                <Label htmlFor="customer_name">Full name</Label>
                <Input
                    id="customer_name"
                    value={values.customer_name}
                    onChange={(e) => onChange('customer_name', e.target.value)}
                />
                <InputError message={errors.customer_name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                        id="customer_email"
                        type="email"
                        value={values.customer_email}
                        onChange={(e) =>
                            onChange('customer_email', e.target.value)
                        }
                    />
                    <InputError message={errors.customer_email} />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="customer_phone">Phone</Label>
                    <Input
                        id="customer_phone"
                        value={values.customer_phone}
                        onChange={(e) =>
                            onChange('customer_phone', e.target.value)
                        }
                    />
                    <InputError message={errors.customer_phone} />
                </div>
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                    id="notes"
                    rows={3}
                    value={values.notes}
                    onChange={(e) => onChange('notes', e.target.value)}
                    placeholder="Anything we should know?"
                />
            </div>
        </div>
    );
}
