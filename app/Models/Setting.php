<?php

namespace App\Models;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Per-business key-value store for business configuration.
 *
 * Every row belongs to one business, so each venue has its own name, hours,
 * booking rules and so on. Reads and writes resolve the business from the
 * {@see TenantContext}; the cache is namespaced by business id so one venue's
 * values are never served to another.
 */
class Setting extends Model
{
    protected $fillable = ['business_id', 'key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    public $timestamps = true;

    /**
     * Latched true once the tenant column exists (only false mid-migration).
     */
    private static ?bool $hasBusinessColumn = null;

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
            'business_website' => null,
            'business_city' => null,
            'business_country' => null,
            'currency' => 'PHP',
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
     * All settings for the current business, merged over the defaults.
     *
     * @return array<string, mixed>
     */
    public static function values(): array
    {
        $businessId = self::currentBusinessId();

        return Cache::rememberForever(self::cacheKey($businessId), function () use ($businessId) {
            $query = static::query();

            if (self::hasBusinessColumn()) {
                $query->where('business_id', $businessId);
            }

            $stored = $query->pluck('value', 'key')->toArray();

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
        $businessId = self::currentBusinessId();
        $keyColumns = self::hasBusinessColumn()
            ? fn (string $key): array => ['business_id' => $businessId, 'key' => $key]
            : fn (string $key): array => ['key' => $key];

        foreach ($values as $key => $value) {
            static::query()->updateOrCreate($keyColumns($key), ['value' => $value]);
        }

        Cache::forget(self::cacheKey($businessId));
    }

    /**
     * The business these settings belong to — the bound tenant, or the first
     * business as a fallback outside a request (console, queue).
     */
    private static function currentBusinessId(): ?int
    {
        $tenant = app(TenantContext::class);

        if ($tenant->has()) {
            return $tenant->id();
        }

        if (! self::hasBusinessColumn()) {
            return null;
        }

        $fallback = static::query()->min('business_id');

        return $fallback !== null ? (int) $fallback : null;
    }

    private static function hasBusinessColumn(): bool
    {
        if (self::$hasBusinessColumn === true) {
            return true;
        }

        if (Schema::hasColumn('settings', 'business_id')) {
            return self::$hasBusinessColumn = true;
        }

        return false;
    }

    private static function cacheKey(?int $businessId): string
    {
        return 'settings.all.'.($businessId ?? 'none');
    }
}
