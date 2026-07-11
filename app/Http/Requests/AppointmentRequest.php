<?php

namespace App\Http\Requests;

use App\Enums\AppointmentStatus;
use App\Services\AvailabilityService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

class AppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Customer details — resolved/created from these on save.
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],

            'service_id' => ['required', 'exists:services,id'],
            'staff_id' => ['nullable', 'exists:staff,id'],
            'appointment_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration' => ['required', 'integer', 'min:5', 'max:1440'],
            'status' => ['required', new Enum(AppointmentStatus::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Enforce scheduling rules (hours, working days, staff availability, overlap)
     * after the field rules pass. Interval alignment is advisory for admins.
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

                $data = array_merge($this->validated(), ['enforce_interval' => false]);
                $availability = resolve(AvailabilityService::class);

                foreach ($availability->violations($data, $this->route('appointment')) as $field => $message) {
                    $validator->errors()->add($field, $message);
                }
            },
        ];
    }
}
