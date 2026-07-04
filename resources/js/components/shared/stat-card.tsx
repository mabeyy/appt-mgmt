import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
    label: string;
    value: number | string;
    icon: LucideIcon;
    accent?: string; // tailwind text color class for the icon
    iconBg?: string; // tailwind bg color class for the icon chip
};

export function StatCard({
    label,
    value,
    icon: Icon,
    accent = 'text-primary',
    iconBg = 'bg-primary/10',
}: StatCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
                <div
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                        iconBg,
                    )}
                >
                    <Icon className={cn('size-5', accent)} />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
