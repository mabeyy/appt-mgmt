<x-mail::message>
# Booking received

Hi {{ $appointment->customer->full_name }},

Thanks for booking with **{{ $business }}**. We've received your request with the details below.

- **Reference:** {{ $appointment->appointment_number }}
- **Service:** {{ $appointment->service->name }}
- **Staff:** {{ $appointment->staff?->name ?? 'Any available' }}
- **Date:** {{ $appointment->appointment_date->format('l, F j, Y') }}
- **Time:** {{ substr((string) $appointment->start_time, 0, 5) }}
- **Duration:** {{ $appointment->duration }} minutes

Your appointment is currently **pending confirmation** — we'll be in touch shortly to confirm.

Thanks,<br>
{{ $business }}
</x-mail::message>
