<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    public $timestamps = true;

    /**
     * Default settings used when nothing is stored yet.
     *
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'business_name' => config('app.name', 'Appointo'),
            'business_logo' => null,
            'business_email' => null,
            'business_phone' => null,
            'business_address' => null,
            'timezone' => config('app.timezone', 'UTC'),
            'business_hours_start' => '09:00',
            'business_hours_end' => '18:00',
            'working_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            'appointment_interval' => 30,
            'max_appointments_per_day' => 50,
            'buffer_time' => 0,
            'manual_approval' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function values(): array
    {
        return Cache::rememberForever('settings.all', function () {
            $stored = static::query()->pluck('value', 'key')->toArray();

            return array_merge(static::defaults(), $stored);
        });
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::values()[$key] ?? $default;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Cache::forget('settings.all');
    }
}
