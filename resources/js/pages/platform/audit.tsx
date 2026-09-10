import { Head, Link, router } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';

type LogRow = {
    id: number;
    action: string;
    actor: string | null;
    business: string | null;
    entity: string | null;
    metadata: Record<string, unknown> | null;
    at: string | null;
};

type Paginator<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = { logs: Paginator<LogRow> };

export default function PlatformAudit({ logs }: Props) {
    return (
        <>
            <Head title="Audit log" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
                <header className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ScrollText className="size-6" />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
                        <p className="text-muted-foreground">Important actions across every tenant.</p>
                    </div>
                    <Link href="/platform" className="ml-auto text-sm text-muted-foreground hover:underline">
                        ← Back to console
                    </Link>
                </header>

                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">When</th>
                                <th className="p-3 font-medium">Action</th>
                                <th className="p-3 font-medium">Actor</th>
                                <th className="p-3 font-medium">Business</th>
                                <th className="p-3 font-medium">Entity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.data.map((log) => (
                                <tr key={log.id}>
                                    <td className="whitespace-nowrap p-3 text-muted-foreground">{log.at}</td>
                                    <td className="p-3">
                                        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">{log.action}</span>
                                    </td>
                                    <td className="p-3">{log.actor}</td>
                                    <td className="p-3">{log.business ?? '—'}</td>
                                    <td className="p-3 text-muted-foreground">{log.entity ?? '—'}</td>
                                </tr>
                            ))}
                            {logs.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                        No activity yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-1">
                    {logs.links.map((link, i) => (
                        <button
                            key={i}
                            type="button"
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                            className={`rounded-md px-3 py-1.5 text-sm ${
                                link.active ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted/50'
                            } disabled:opacity-40`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
