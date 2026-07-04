import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { AppointmentForm } from '@/components/appointments/appointment-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/appointments';
import type { Customer, Service, StatusOption, Staff } from '@/types';

type Props = {
    services: Pick<Service, 'id' | 'name' | 'duration' | 'price'>[];
    staff: Pick<Staff, 'id' | 'name'>[];
    customers: Pick<Customer, 'id' | 'full_name' | 'email' | 'phone'>[];
    statuses: StatusOption[];
};

export default function AppointmentCreate({
    services,
    staff,
    customers,
    statuses,
}: Props) {
    return (
        <>
            <Head title="New appointment" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={index()} />}
                    >
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Button>
                    <PageHeader
                        title="New Appointment"
                        description="Book a new appointment."
                    />
                </div>
                <AppointmentForm
                    services={services}
                    staff={staff}
                    customers={customers}
                    statuses={statuses}
                />
            </div>
        </>
    );
}

AppointmentCreate.layout = {
    breadcrumbs: [
        { title: 'Appointments', href: index() },
        { title: 'New', href: index() },
    ],
};
