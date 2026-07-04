<?php

namespace App\Actions;

use App\Models\Customer;

class ResolveCustomer
{
    /**
     * Find an existing customer or create one from appointment form data.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Customer
    {
        if (! empty($data['customer_id'])) {
            return Customer::findOrFail($data['customer_id']);
        }

        if (! empty($data['customer_email'])) {
            return Customer::firstOrCreate(
                ['email' => $data['customer_email']],
                [
                    'full_name' => $data['customer_name'],
                    'phone' => $data['customer_phone'] ?? null,
                ],
            );
        }

        return Customer::create([
            'full_name' => $data['customer_name'],
            'email' => $data['customer_email'] ?? null,
            'phone' => $data['customer_phone'] ?? null,
        ]);
    }
}
