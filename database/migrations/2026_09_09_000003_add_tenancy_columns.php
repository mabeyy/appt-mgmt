<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add the tenant key to every domain table, plus the role/link columns the
 * three-role model needs and the resource link on appointments.
 *
 * Columns are nullable and carry no database-level foreign key, to apply
 * cleanly to the existing single business's data and stay portable across
 * SQLite and MySQL; the next migration adopts that data and tightens the
 * per-business unique keys.
 */
return new class extends Migration
{
    /**
     * Tables that gain a plain, indexed business_id.
     *
     * @var array<int, string>
     */
    private array $tables = [
        'users',
        'appointments',
        'services',
        'staff',
        'customers',
        'admin_notifications',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->unsignedBigInteger('business_id')->nullable()->after('id');
                $table->index('business_id');
            });
        }

        // Tables whose existing unique key must become per-business.
        Schema::table('settings', function (Blueprint $table): void {
            $table->unsignedBigInteger('business_id')->nullable()->after('id');
            $table->dropUnique('settings_key_unique');
        });

        Schema::table('service_groups', function (Blueprint $table): void {
            $table->unsignedBigInteger('business_id')->nullable()->after('id');
            $table->dropUnique('service_groups_name_unique');
        });

        // The three-role model + provider login link.
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('staff')->after('email');
        });

        Schema::table('staff', function (Blueprint $table): void {
            $table->unsignedBigInteger('user_id')->nullable()->after('business_id')->index();
        });

        // Appointments in a resource vertical point at a resource instead of a
        // service + provider.
        Schema::table('appointments', function (Blueprint $table): void {
            $table->unsignedBigInteger('resource_id')->nullable()->after('staff_id')->index();
        });
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table): void {
                $table->dropIndex(['business_id']);
                $table->dropColumn('business_id');
            });
        }

        Schema::table('settings', function (Blueprint $table): void {
            $table->dropColumn('business_id');
            $table->unique('key');
        });

        Schema::table('service_groups', function (Blueprint $table): void {
            $table->dropColumn('business_id');
            $table->unique('name');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('role');
        });

        Schema::table('staff', function (Blueprint $table): void {
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });

        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropIndex(['resource_id']);
            $table->dropColumn('resource_id');
        });
    }
};
