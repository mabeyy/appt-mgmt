<?php

namespace App\Http\Requests\Public;

use App\Enums\AppointmentStatus;
use App\Models\Service;
use App\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PublicBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Never trust client-supplied privileged fields on a public endpoint.
     */
    protected function prepareForValidation(): void
    {
        $this->request->remove('status');
        $this->request->remove('duration');
        $this->request->remove('customer_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'service_id' => ['required', Rule::exists('services', 'id')->where('is_active', true)],
            'staff_id' => ['nullable', Rule::exists('staff', 'id')->where('is_active', true)],
            'appointment_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email:rfc', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Public bookings must be in the future and aligned to the booking
     * interval (the slot picker only ever offers such times; this guards
     * hand-crafted POSTs).
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $settings = Setting::values();
                $tz = $settings['timezone'] ?? config('app.timezone');
                $start = Carbon::parse(
                    $this->input('appointment_date').' '.$this->input('start_time'),
                    $tz,
                );

                if ($start->isPast()) {
                    $validator->errors()->add('start_time', 'Please choose a time in the future.');

                    return;
                }

                $interval = (int) ($settings['appointment_interval'] ?? 30);
                $open = Carbon::parse($this->input('appointment_date').' '.$settings['business_hours_start'], $tz);
                if ($interval > 0 && $open->diffInMinutes($start, false) % $interval !== 0) {
                    $validator->errors()->add('start_time', 'Please choose a time on a '.$interval.'-minute interval.');
                }
            },
        ];
    }

    /**
     * Validated data plus server-derived, non-negotiable fields: status is
     * forced to pending and duration is taken from the chosen service.
     *
     * @return array<string, mixed>
     */
    public function bookingData(): array
    {
        $service = Service::findOrFail($this->integer('service_id'));

        return [
            ...$this->validated(),
            'duration' => $service->duration,
            'status' => AppointmentStatus::Pending->value,
        ];
    }
}
