<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // karena kamu tidak pakai email, jangan refer ke kolom email
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->unique()->after('id');
            }

            if (!Schema::hasColumn('users', 'role')) {
                // taruh setelah password (biasanya ada di default users)
                $table->string('role')->default('admin')->after('password');
            }

            if (!Schema::hasColumn('users', 'api_token')) {
                // taruh setelah remember_token (biasanya ada di default users)
                $table->string('api_token', 80)->nullable()->unique()->after('remember_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // drop unique kalau ada (lebih aman di MySQL)
            if (Schema::hasColumn('users', 'api_token')) {
                $table->dropUnique(['api_token']);
            }

            $toDrop = [];
            if (Schema::hasColumn('users', 'username')) $toDrop[] = 'username';
            if (Schema::hasColumn('users', 'role')) $toDrop[] = 'role';
            if (Schema::hasColumn('users', 'api_token')) $toDrop[] = 'api_token';

            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
