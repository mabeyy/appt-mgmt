<?php

namespace App\Exports;

use App\Models\Appointment;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AppointmentsExport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * @param  Collection<int, Appointment>  $appointments
     */
    public function __construct(protected Collection $appointments) {}

    /**
     * @return Collection<int, Appointment>
     */
    public function collection(): Collection
    {
        return $this->appointments;
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Appointment #', 'Customer', 'Email', 'Phone', 'Service', 'Staff', 'Date', 'Time', 'Duration (min)', 'Status'];
    }

    /**
     * @param  Appointment  $row
     * @return array<int, mixed>
     */
    public function map($row): array
    {
        return [
            $row->appointment_number,
            $row->customer?->full_name,
            $row->customer?->email,
            $row->customer?->phone,
            $row->service?->name,
            $row->staff?->name ?? '—',
            $row->appointment_date?->format('Y-m-d'),
            substr((string) $row->start_time, 0, 5),
            $row->duration,
            $row->status->label(),
        ];
    }
}
