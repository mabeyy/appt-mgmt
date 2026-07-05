export type BookingService = {
    id: number;
    name: string;
    description: string | null;
    duration: number;
    price: string | number;
};

export type BookingGroup = {
    id: number;
    name: string;
    services: BookingService[];
};

export type BookingStaff = {
    id: number;
    name: string;
    position: string | null;
};
