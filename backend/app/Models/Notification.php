<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Notificação in-app (D-04). Tabela própria do domínio, distinta do sistema
 * de notificações nativo do Laravel (Notifiable::notifications(), usado hoje
 * só pelo canal `mail` em ResetPasswordNotification/verificação de email).
 */
class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'data', 'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    // Expõe `read` (bool) pro frontend, que não trabalha com read_at diretamente.
    protected $appends = ['read'];

    public function getReadAttribute(): bool
    {
        return ! is_null($this->read_at);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }
}
