<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBusiness;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use BelongsToBusiness, HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'address',
    ];

    /** @return HasMany<Appointment, $this> */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
