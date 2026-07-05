import { SelectableCard } from './selectable-card';
import type { BookingStaff } from './types';

export function StaffPicker({
    staff,
    value,
    onSelect,
}: {
    staff: BookingStaff[];
    value: string;
    onSelect: (staffId: string) => void;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <SelectableCard
                selected={value === ''}
                onClick={() => onSelect('')}
            >
                <span className="font-medium">Any available</span>
                <p className="mt-1 text-xs text-muted-foreground">
                    We'll assign the first free staff member.
                </p>
            </SelectableCard>
            {staff.map((member) => (
                <SelectableCard
                    key={member.id}
                    selected={value === String(member.id)}
                    onClick={() => onSelect(String(member.id))}
                >
                    <span className="font-medium">{member.name}</span>
                    {member.position && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {member.position}
                        </p>
                    )}
                </SelectableCard>
            ))}
        </div>
    );
}
