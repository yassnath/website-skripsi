<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('armadas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_truk');
            $table->string('plat_nomor')->unique();
            $table->integer('kapasitas')->default(0);
            $table->string('status')->default('Ready');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('armadas');
    }
};
