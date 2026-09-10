<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Resource bookings (courts / resource verticals) have no service, so
 * appointments.service_id must be nullable. Service appointments still set it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->unsignedBigInteger('service_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->unsignedBigInteger('service_id')->nullable(false)->change();
        });
    }
};
