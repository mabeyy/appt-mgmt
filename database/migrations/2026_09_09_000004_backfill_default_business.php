<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adopt the existing single business's data into the platform's first business.
 *
 * The app began as one salon; this makes it the first tenant, stamps every
 * orphaned row with its id, marks existing admins as owners, and re-adds the
 * per-business unique keys the previous migration dropped. Idempotent and safe
 * on a fresh install.
 */
return new class extends Migration
{
    /**
     * @var array<int, string>
     */
    private array $tables = [
        'users',
        'appointments',
        'services',
        'staff',
        'customers',
        'admin_notifications',
        'settings',
        'service_groups',
    ];

    public function up(): void
    {
        $businessId = $this->defaultBusinessId();

        foreach ($this->tables as $table) {
            DB::table($table)->whereNull('business_id')->update(['business_id' => $businessId]);
        }

        // Everyone who could reach the panel until now owned the business.
        DB::table('users')->update(['role' => 'tenant']);

        Schema::table('settings', function (Blueprint $table): void {
            $table->unique(['business_id', 'key']);
        });

        Schema::table('service_groups', function (Blueprint $table): void {
            $table->unique(['business_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table): void {
            $table->dropUnique(['business_id', 'key']);
        });

        Schema::table('service_groups', function (Blueprint $table): void {
            $table->dropUnique(['business_id', 'name']);
        });
    }

    private function defaultBusinessId(): int
    {
        $existing = DB::table('businesses')->min('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        // Seed identity from the current single-business settings where present.
        $stored = DB::table('settings')->pluck('value', 'key');
        $name = $this->settingString($stored['business_name'] ?? null) ?? config('app.name', 'My Business');
        $timezone = $this->settingString($stored['timezone'] ?? null) ?? config('app.timezone', 'UTC');

        return (int) DB::table('businesses')->insertGetId([
            'name' => $name,
            'slug' => 'default',
            'type' => 'salon',
            'timezone' => $timezone,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Settings values are stored JSON-encoded (array cast); pull a scalar back.
     */
    private function settingString(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $decoded = json_decode((string) $raw, true);
        $value = is_string($decoded) ? $decoded : $raw;

        return is_string($value) && $value !== '' ? $value : null;
    }
};
