<?php

namespace App\Services;

use App\Models\Notification;

/**
 * D-04: ponto único de criação de notificações in-app. Injetável em qualquer
 * controller (ex: InternalNotificationController, que recebe o aviso do
 * ai-service quando um documento termina de processar).
 */
class NotificationService
{
    public function send(int $userId, string $type, string $title, string $body, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => $data ?: null,
        ]);
    }
}
