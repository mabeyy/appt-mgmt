<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\ProductCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductCategory extends Model
{
    /** @use HasFactory<ProductCategoryFactory> */
    use BelongsToBusiness, HasFactory;

    protected $fillable = ['name'];

    /** @return HasMany<Product, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
