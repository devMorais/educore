<?php

namespace App\Providers;

use App\Events\AuditableEvent;
use App\Listeners\RecordAuditLog;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auditoria assíncrona (BS-022): evento -> listener (fila) -> audit_logs
        Event::listen(AuditableEvent::class, RecordAuditLog::class);
    }
}
