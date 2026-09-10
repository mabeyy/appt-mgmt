<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use BelongsToBusiness, HasFactory;

    protected $fillable = [
        'product_category_id',
        'name',
        'description',
        'sku',
        'price',
        'stock',
        'low_stock_threshold',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'low_stock_threshold' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<ProductCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    /**
     * Whether stock has fallen to or below the low-stock threshold.
     */
    public function isLowStock(): bool
    {
        return $this->low_stock_threshold > 0 && $this->stock <= $this->low_stock_threshold;
    }
}
