<?php

namespace App\Actions;

use App\Models\Customer;

class ResolveCustomer
{
    /**
     * Always create a new customer record from the submitted appointment data.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Customer
    {
        return Customer::create([
            'full_name' => $data['customer_name'],
            'email' => $data['customer_email'] ?? null,
            'phone' => $data['customer_phone'] ?? null,
        ]);
    }
}
