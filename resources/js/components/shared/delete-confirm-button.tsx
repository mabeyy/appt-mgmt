import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';

/**
 * Ghost trash icon button that confirms, then issues a DELETE to `url`.
 * Shared by every index/table row action.
 */
export function DeleteConfirmButton({
    title,
    description,
    url,
    label = 'Delete',
}: {
    title: string;
    description: string;
    url: string;
    label?: string;
}) {
    return (
        <ConfirmDialog
            title={title}
            description={description}
            confirmLabel="Delete"
            destructive
            onConfirm={() => router.delete(url, { preserveScroll: true })}
            trigger={
                <Button variant="ghost" size="icon-sm">
                    <Trash2 className="text-destructive" />
                    <span className="sr-only">{label}</span>
                </Button>
            }
        />
    );
}
