import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/**
 * Active / Inactive / All statuses filter shared by the services and staff
 * index pages.
 */
export function StatusFilterSelect({
    value,
    onValueChange,
    className = 'w-40',
}: {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
}) {
    return (
        <Select
            value={value}
            onValueChange={(v) => onValueChange(String(v))}
            items={{
                all: 'All statuses',
                active: 'Active',
                inactive: 'Inactive',
            }}
        >
            <SelectTrigger className={className}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
        </Select>
    );
}
