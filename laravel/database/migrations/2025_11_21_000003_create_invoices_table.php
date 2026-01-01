<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            $table->string('no_invoice')->unique();
            $table->string('nama_pelanggan');

            $table->string('email')->nullable();
            $table->string('no_telp')->nullable();

            $table->date('tanggal');
            $table->date('due_date')->nullable();

            $table->foreignId('armada_id')
                ->nullable()
                ->constrained('armadas')
                ->nullOnDelete();

            $table->date('armada_start_date')->nullable();
            $table->date('armada_end_date')->nullable();

            // ✅ wajib
            $table->string('lokasi_muat');
            $table->string('lokasi_bongkar');

            // ✅ jangan default 0, biar benar-benar harus diisi
            $table->decimal('tonase', 12, 2);
            $table->decimal('harga', 12, 2);
            $table->decimal('total_biaya', 12, 2)->default(0);
            $table->decimal('pph', 12, 2)->default(0);
            $table->decimal('total_bayar', 12, 2)->default(0);

            // ✅ rincian wajib
            $table->json('rincian');

            $table->string('status')->default('Unpaid');
            $table->string('diterima_oleh')->default('Admin');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
