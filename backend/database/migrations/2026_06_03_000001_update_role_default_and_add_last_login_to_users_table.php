<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Atualiza a coluna role:
 *   - Muda o default de 'user' para 'student'
 *   - Converte usuários existentes com role='user' para 'student'
 * Adiciona last_login_at para rastrear usuários ativos (BS-009).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('student')->change();
            $table->timestamp('last_login_at')->nullable()->after('role');
        });

        // Migra registros antigos com role='user' para 'student'
        DB::table('users')->where('role', 'user')->update(['role' => 'student']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->change();
            $table->dropColumn('last_login_at');
        });
    }
};
