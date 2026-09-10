<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Full-day closures — holidays, special dates, temporary closures. Scoped per
 * business; no bookings are offered or accepted on these dates.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('closed_dates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('business_id')->index();
            $table->date('date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('closed_dates');
    }
};
