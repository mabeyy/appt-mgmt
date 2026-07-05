import { formatCurrency, formatDuration } from '@/lib/format';
import { SelectableCard } from './selectable-card';
import type { BookingGroup, BookingService } from './types';

export function ServicePicker({
    groups,
    value,
    onSelect,
}: {
    groups: BookingGroup[];
    value: string;
    onSelect: (service: BookingService) => void;
}) {
    if (groups.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No services are available for booking right now.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <div key={group.id} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                        {group.name}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {group.services.map((service) => (
                            <SelectableCard
                                key={service.id}
                                selected={value === String(service.id)}
                                onClick={() => onSelect(service)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-medium">
                                        {service.name}
                                    </span>
                                    <span className="text-sm font-medium">
                                        {formatCurrency(service.price)}
                                    </span>
                                </div>
                                {service.description && (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {service.description}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {formatDuration(service.duration)}
                                </p>
                            </SelectableCard>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
