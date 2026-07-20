<?php

namespace App\Models;

use App\Events\AuditableEvent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Log de auditoria (BS-022). Registro imutável de uma ação importante do sistema.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $action
 * @property string|null $resource_type
 * @property string|null $resource_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property array<array-key, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property-read \App\Models\User|null $user
 * @method static Builder<static>|AuditLog newModelQuery()
 * @method static Builder<static>|AuditLog newQuery()
 * @method static Builder<static>|AuditLog query()
 * @method static Builder<static>|AuditLog whereAction($value)
 * @method static Builder<static>|AuditLog whereCreatedAt($value)
 * @method static Builder<static>|AuditLog whereId($value)
 * @method static Builder<static>|AuditLog whereIpAddress($value)
 * @method static Builder<static>|AuditLog whereMetadata($value)
 * @method static Builder<static>|AuditLog whereResourceId($value)
 * @method static Builder<static>|AuditLog whereResourceType($value)
 * @method static Builder<static>|AuditLog whereUserAgent($value)
 * @method static Builder<static>|AuditLog whereUserId($value)
 * @mixin \Eloquent
 */
class AuditLog extends Model
{
    use Prunable;

    /** Apenas created_at (setado manualmente em record()); sem updated_at. */
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'action', 'resource_type', 'resource_id',
        'ip_address', 'user_agent', 'metadata', 'created_at',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    // ── Ações auditadas (BS-022) ──
    public const LOGIN          = 'login';
    public const LOGOUT         = 'logout';
    public const LOGIN_FAILED   = 'login_failed';
    public const REGISTER       = 'register';
    public const ROLE_CHANGED   = 'role_changed';
    public const USER_BLOCKED   = 'user_blocked';
    public const USER_UNBLOCKED = 'user_unblocked';

    // Originadas no AI Service (FastAPI) — registráveis via record()/log() quando reportadas
    public const DOCUMENT_UPLOADED = 'document_uploaded';
    public const DOCUMENT_DELETED  = 'document_deleted';
    public const CONTENT_GENERATED = 'content_generated';
    public const EXPORT            = 'export';

    // ── D-02: Recuperação de senha ──
    public const PASSWORD_RESET_REQUESTED = 'password_reset_requested';
    public const PASSWORD_RESET_COMPLETED = 'password_reset_completed';

    /**
     * Escrita de baixo nível do log. Usada pelo Listener (após o evento) e por
     * chamadas síncronas. `AuditLog::record()` estático conforme o aceite.
     */
    public static function record(string $action, array $attrs = []): self
    {
        return static::create(array_merge(
            ['action' => $action, 'created_at' => now()],
            $attrs,
        ));
    }

    /**
     * Entrada de instrumentação (controllers): captura IP/User-Agent do request
     * atual e DISPARA o evento assíncrono — a persistência acontece no Listener
     * (via fila). Não bloqueia a resposta da requisição.
     */
    public static function log(string $action, array $opts = []): void
    {
        $req = request();

        AuditableEvent::dispatch(
            $action,
            $opts['user_id']       ?? optional($req?->user())->id,
            $opts['resource_type'] ?? null,
            isset($opts['resource_id']) ? (string) $opts['resource_id'] : null,
            $opts['ip_address']    ?? $req?->ip(),
            $opts['user_agent']    ?? ($req ? substr((string) $req->userAgent(), 0, 1000) : null),
            $opts['metadata']      ?? [],
        );
    }

    /**
     * Retenção: remove logs com mais de 90 dias (executado por `model:prune`).
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subDays(90));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}