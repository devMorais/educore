<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * D-02: notificação customizada de redefinição de senha.
 * Aponta o link pra tela do Angular (/redefinir-senha) em vez da rota
 * Blade padrão do Laravel.
 */
class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $token)
    {
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url'), '/')
            . '/redefinir-senha?token=' . $this->token
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage())
            ->subject('Redefinição de senha - EduCore')
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line('Você solicitou a redefinição da sua senha no EduCore.')
            ->action('Redefinir senha', $url)
            ->line('Este link expira em 60 minutos.')
            ->line('Se você não solicitou essa alteração, pode ignorar este email com segurança.');
    }
}