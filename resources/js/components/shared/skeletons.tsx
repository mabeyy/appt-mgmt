import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return <Skeleton className="w-full rounded-md" style={{ height }} />;
}

export function WidgetCardSkeleton() {
    return (
        <Card>
            <CardHeader className="gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
                <WidgetSkeleton />
            </CardContent>
        </Card>
    );
}

export function WidgetSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between gap-3"
                >
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}
