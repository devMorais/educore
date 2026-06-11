<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Evento de auditoria (BS-022). Carrega apenas escalares/arrays para ser
 * serializável na fila — o IP e o User-Agent são capturados no momento da ação
 * (no controller), pois o Request não existe no worker que processa a fila.
 */
class AuditableEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $action,
        public ?int $userId = null,
        public ?string $resourceType = null,
        public ?string $resourceId = null,
        public ?string $ipAddress = null,
        public ?string $userAgent = null,
        public array $metadata = [],
    ) {
    }
}
