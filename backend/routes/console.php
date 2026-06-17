<?php

use App\Models\AuditLog;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── BS-022: agendamentos ──
// Requer o cron do Laravel no servidor:  * * * * * php artisan schedule:run

// Retenção: remove logs de auditoria com mais de 90 dias (via prunable() do model).
Schedule::command('model:prune', ['--model' => [AuditLog::class]])->daily();

// Processa a fila de auditoria (listener assíncrono) em hosts sem worker dedicado.
// Em escala, troque por um worker persistente (queue:work) ou Horizon (Redis).
Schedule::command('queue:work --stop-when-empty --max-time=55')
    ->everyMinute()
    ->withoutOverlapping();
