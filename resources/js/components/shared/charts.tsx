import { ChartSpline } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { EmptyState } from '@/components/shared/empty-state';

const AXIS = 'var(--color-muted-foreground)';
const GRID = 'var(--color-border)';

const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    background: 'var(--color-popover)',
    color: 'var(--color-popover-foreground)',
    fontSize: 12,
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
};

function ChartEmpty({ label }: { label: string }) {
    return (
        <EmptyState
            icon={ChartSpline}
            title="No data yet"
            description={label}
        />
    );
}

export function AppLineChart({
    data,
    xKey,
    yKey,
    height = 288,
}: {
    data: Array<Record<string, string | number>>;
    xKey: string;
    yKey: string;
    height?: number;
}) {
    if (!data.some((d) => Number(d[yKey]) > 0)) {
        return (
            <ChartEmpty label="Trends will appear once you have appointments." />
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart
                data={data}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID}
                    vertical={false}
                />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: AXIS, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fill: AXIS, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: GRID }}
                />
                <Line
                    type="monotone"
                    dataKey={yKey}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-primary)' }}
                    activeDot={{ r: 5 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function AppBarChart({
    data,
    xKey,
    yKey,
    height = 288,
    color = 'var(--color-primary)',
}: {
    data: Array<Record<string, string | number>>;
    xKey: string;
    yKey: string;
    height?: number;
    color?: string;
}) {
    if (data.length === 0) {
        return (
            <ChartEmpty label="Data will appear once you have appointments." />
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID}
                    vertical={false}
                />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: AXIS, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fill: AXIS, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--color-muted)' }}
                />
                <Bar
                    dataKey={yKey}
                    fill={color}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function AppPieChart({
    data,
    height = 288,
}: {
    data: Array<{ status: string; value: number; color: string }>;
    height?: number;
}) {
    if (!data.some((d) => d.value > 0)) {
        return (
            <ChartEmpty label="Status breakdown will appear once you have appointments." />
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer
                width="100%"
                height={height}
                className="max-w-[240px]"
            >
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="status"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        strokeWidth={0}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.status} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
            </ResponsiveContainer>
            <ul className="grid w-full gap-2 text-sm sm:flex-1 sm:pr-6">
                {data.map((entry) => (
                    <li
                        key={entry.status}
                        className="flex items-center justify-between gap-2"
                    >
                        <span className="flex items-center gap-2">
                            <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">
                                {entry.status}
                            </span>
                        </span>
                        <span className="font-medium">{entry.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
