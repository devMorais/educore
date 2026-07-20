<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Tamanho de página fixo — o frontend (sino do header) espera um array
     * plano, não o envelope padrão do paginator do Laravel.
     */
    private const PER_PAGE = 20;

    /**
     * Lista as notificações do usuário autenticado, mais recentes primeiro.
     * Paginado internamente (LIMIT/OFFSET real), mas devolve só o array de
     * itens — o overlay do sino não implementa navegação de páginas hoje.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(self::PER_PAGE, ['*'], 'page', (int) $request->input('page', 1));

        return response()->json($notifications->items());
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return response()->json(['count' => $count]);
    }

    /** Isolamento: só marca como lida se a notificação pertencer ao usuário autenticado. */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);

        if (is_null($notification->read_at)) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
