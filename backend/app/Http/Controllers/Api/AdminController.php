<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Retorna métricas gerais da plataforma (BS-009).
     */
    public function stats(): JsonResponse
    {
        $totalUsers       = User::count();
        $activeUsers7Days = User::whereNotNull('last_login_at')
            ->where('last_login_at', '>=', now()->subDays(7))
            ->count();

        // Registros por dia nos últimos 30 dias
        $registrationsByDay = User::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Tenta buscar stats do AI Service (falha silenciosamente)
        $aiStats = $this->fetchAiStats();

        return response()->json([
            'total_users'           => $totalUsers,
            'total_documents'       => $aiStats['total_documents'] ?? 0,
            'total_generations'     => $aiStats['total_generations'] ?? 0,
            'active_users_7days'    => $activeUsers7Days,
            'uploads_per_day'       => $aiStats['uploads_per_day'] ?? [],
            'registrations_per_day' => $registrationsByDay,
        ]);
    }

    /**
     * Lista usuários paginados com filtros opcionais (BS-006 + BS-009).
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $users = $query->orderBy('created_at', 'desc')
                       ->paginate(20);

        return response()->json($users);
    }

    /**
     * Atualiza o papel de um usuário (BS-009).
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'role' => 'required|in:admin,professor,student',
        ])->validate();

        $user = User::findOrFail($id);
        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'Papel atualizado com sucesso.',
            'user'    => $user,
        ]);
    }

    /**
     * Bloqueia ou desbloqueia um usuário (BS-009).
     * Usa o campo email_verified_at como indicador de status ativo.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'active' => 'required|boolean',
        ])->validate();

        $user = User::findOrFail($id);

        if ($validated['active']) {
            $user->update(['email_verified_at' => $user->email_verified_at ?? now()]);
        } else {
            $user->update(['email_verified_at' => null]);
        }

        return response()->json([
            'message' => $validated['active'] ? 'Usuário desbloqueado.' : 'Usuário bloqueado.',
            'user'    => $user,
        ]);
    }

    private function fetchAiStats(): array
    {
        try {
            $token   = request()->bearerToken();
            $baseUrl = config('services.ai_service.url', env('AI_SERVICE_URL', 'http://localhost:8001'));
            $res     = Http::withToken($token)
                ->timeout(3)
                ->get("{$baseUrl}/admin/stats");

            return $res->successful() ? $res->json() : [];
        } catch (\Throwable) {
            return [];
        }
    }
}
