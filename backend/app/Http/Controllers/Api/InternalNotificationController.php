<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * D-04: recebe o aviso do ai-service (webhook interno, protegido por
 * VerifyInternalApiKey) quando o processamento de um documento termina, e
 * cria a notificação in-app correspondente via NotificationService.
 */
class InternalNotificationController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'type'    => ['required', 'string', 'max:50'],
            'title'   => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string'],
            'data'    => ['nullable', 'array'],
        ]);

        $notification = $this->notifications->send(
            (int) $data['user_id'],
            $data['type'],
            $data['title'],
            $data['body'],
            $data['data'] ?? [],
        );

        return response()->json(['notification' => $notification], 201);
    }
}
