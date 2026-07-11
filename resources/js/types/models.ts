export type AppointmentStatusValue =
    'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type StatusOption = {
    value: AppointmentStatusValue;
    label: string;
    color: string;
};

export type ServiceGroup = {
    id: number;
    name: string;
};

export type Service = {
    id: number;
    service_group_id: number | null;
    name: string;
    description: string | null;
    duration: number;
    price: string | number;
    is_active: boolean;
    group?: ServiceGroup | null;
    created_at?: string;
    updated_at?: string;
};

export type Staff = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    working_days: string[] | null;
    working_start: string | null;
    working_end: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export type Customer = {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    appointments_count?: number;
    is_duplicate?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type Appointment = {
    id: number;
    appointment_number: string;
    customer_id: number;
    service_id: number;
    staff_id: number | null;
    appointment_date: string;
    start_time: string;
    duration: number;
    status: AppointmentStatusValue;
    notes: string | null;
    customer?: Customer;
    service?: Service;
    staff?: Staff | null;
    created_at?: string;
    updated_at?: string;
};

/** A lightweight appointment row used in dashboard widgets. */
export type AppointmentWidgetItem = {
    id: number;
    appointment_number: string;
    customer_name: string | null;
    service_name: string | null;
    staff_name: string | null;
    appointment_date: string | null;
    start_time: string;
    status: AppointmentStatusValue;
    status_label: string;
    status_color: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export type BusinessSettings = {
    business_name: string;
    business_logo: string | null;
    business_email: string | null;
    business_phone: string | null;
    business_address: string | null;
    timezone: string;
    business_hours_start: string;
    business_hours_end: string;
    working_days: string[];
    appointment_interval: number;
    max_appointments_per_day: number;
    buffer_time: number;
    manual_approval: boolean;
};

export type AdminNotification = {
    id: number;
    type: string;
    title: string;
    message: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
};
