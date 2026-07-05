import { Checkbox } from '@/components/ui/checkbox';

/**
 * A checkbox with an inline clickable label — the recurring
 * "Active / Require approval / …" toggle used across forms.
 */
export function CheckboxField({
    checked,
    onCheckedChange,
    label,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
}) {
    return (
        <label className="flex items-center gap-2.5">
            <Checkbox
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
            />
            <span className="text-sm">{label}</span>
        </label>
    );
}
