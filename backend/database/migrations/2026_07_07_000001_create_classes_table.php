<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela de turmas (D-01). Cada turma pertence a um professor.
 * Soft deletes: turma "arquivada" não aparece mais nas listagens,
 * mas o histórico de matrículas permanece preservado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            // FK para o professor dono da turma. Sem cascade de delete:
            // se o professor for removido, a turma permanece (auditoria).
            $table->foreignId('professor_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('professor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};