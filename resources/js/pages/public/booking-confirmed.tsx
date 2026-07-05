import { Head, Link } from '@inertiajs/react';
import { CircleCheckBig } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { index as bookIndex } from '@/routes/book';

type Props = {
    appointmentNumber: string;
};

export default function BookingConfirmed({ appointmentNumber }: Props) {
    return (
        <>
            <Head title="Booking received" />

            <div className="mx-auto max-w-md py-8">
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                            <CircleCheckBig className="size-7" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold">
                                Booking received
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Your reference is{' '}
                                <span className="font-medium text-foreground">
                                    {appointmentNumber}
                                </span>
                                . We've emailed your confirmation.
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your appointment is{' '}
                            <span className="font-medium">
                                pending confirmation
                            </span>{' '}
                            — we'll be in touch shortly.
                        </p>
                        <Button render={<Link href={bookIndex()} />}>
                            Book another appointment
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
