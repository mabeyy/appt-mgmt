import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { AppointmentForm } from '@/components/appointments/appointment-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/appointments';
import type { Appointment, Service, StatusOption, Staff } from '@/types';

type Props = {
    appointment: Appointment;
    services: Pick<Service, 'id' | 'name' | 'duration' | 'price'>[];
    staff: Pick<Staff, 'id' | 'name'>[];
    statuses: StatusOption[];
};

export default function AppointmentEdit({
    appointment,
    services,
    staff,
    statuses,
}: Props) {
    return (
        <>
            <Head title={`Edit ${appointment.appointment_number}`} />
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
                        title={`Edit ${appointment.appointment_number}`}
                        description="Update appointment details."
                    />
                </div>
                <AppointmentForm
                    appointment={appointment}
                    services={services}
                    staff={staff}
                    statuses={statuses}
                />
            </div>
        </>
    );
}

AppointmentEdit.layout = {
    breadcrumbs: [
        { title: 'Appointments', href: index() },
        { title: 'Edit', href: index() },
    ],
};
