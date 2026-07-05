import { usePage } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';

function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
        >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    );
}

export default function PublicLayout({ children }: PropsWithChildren) {
    const { business } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground">
                            {business?.logo ? (
                                <img
                                    src={business.logo}
                                    alt={business.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <AppLogoIcon className="size-5 fill-current" />
                            )}
                        </div>
                        <span className="font-semibold">
                            {business?.name ?? 'Appointo'}
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
                {children}
            </main>

            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
                {business?.name ?? 'Appointo'} · Online booking
            </footer>
        </div>
    );
}
