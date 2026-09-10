<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'product_category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'new_category' => ['nullable', 'string', 'max:60'],
            'sku' => ['nullable', 'string', 'max:60'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'is_active' => ['boolean'],
        ];
    }
}
