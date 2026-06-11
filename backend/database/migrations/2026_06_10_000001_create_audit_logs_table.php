<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela de auditoria de acesso e ações importantes (BS-022).
 * Registros imutáveis (somente created_at); retenção de 90 dias via model:prune.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // user_id sem FK constraint: o log sobrevive mesmo se o usuário for excluído.
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action', 64);
            $table->string('resource_type', 64)->nullable();
            $table->string('resource_id', 64)->nullable();   // string p/ aceitar IDs do AI Service
            $table->string('ip_address', 45)->nullable();     // IPv6 cabe em 45 chars
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->nullable();

            // Índices para os filtros do endpoint e para auditoria (BS-022)
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
