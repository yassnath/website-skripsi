<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('no_expense')->unique();
            $table->date('tanggal');
            $table->string('kategori')->nullable();
            $table->string('keterangan')->nullable();
            $table->decimal('total_pengeluaran', 12, 2)->default(0);
            $table->string('status')->default('Paid');
            $table->string('dicatat_oleh')->nullable();

            // JSON untuk rincian
            $table->json('rincian')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
