<?php

namespace App\Listeners;

use App\Events\AuditableEvent;
use App\Models\AuditLog;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Listener ASSÍNCRONO (BS-022): persiste o evento de auditoria via fila, sem
 * bloquear a requisição. Com QUEUE_CONNECTION=database, vira um job na tabela
 * `jobs` processado por um worker (`php artisan queue:work`).
 */
class RecordAuditLog implements ShouldQueue
{
    public function handle(AuditableEvent $event): void
    {
        AuditLog::record($event->action, [
            'user_id'       => $event->userId,
            'resource_type' => $event->resourceType,
            'resource_id'   => $event->resourceId,
            'ip_address'    => $event->ipAddress,
            'user_agent'    => $event->userAgent,
            'metadata'      => $event->metadata ?: null,
        ]);
    }
}
