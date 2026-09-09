<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\ServiceGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceGroup extends Model
{
    /** @use HasFactory<ServiceGroupFactory> */
    use BelongsToBusiness, HasFactory;

    protected $fillable = [
        'name',
    ];

    /** @return HasMany<Service, $this> */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
