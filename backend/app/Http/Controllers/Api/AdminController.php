<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
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
            // Distribuição real por tipo de conteúdo (alimenta o gráfico donut)
            'by_type'               => $aiStats['by_type'] ?? [],
        ]);
    }

    /**
     * Retorna a atividade recente real da plataforma (BS-009).
     * Combina registros de novos usuários (Laravel) com uploads de PDFs
     * recentes (AI Service), resolvendo os nomes dos usuários.
     */
    public function activity(): JsonResponse
    {
        $activities = [];

        // Registros recentes de usuários (sempre disponível — base do Laravel)
        $recentUsers = User::orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['name', 'created_at']);

        foreach ($recentUsers as $user) {
            $activities[] = [
                'type'      => 'registration',
                'name'      => $user->name,
                'action'    => 'Criou uma conta',
                'timestamp' => optional($user->created_at)->toIso8601String(),
            ];
        }

        // Uploads recentes de PDFs (AI Service) com nomes resolvidos
        $recentDocs = $this->fetchAiDocuments();
        if (! empty($recentDocs)) {
            $userIds = collect($recentDocs)->pluck('user_id')->filter()->unique();
            $names   = User::whereIn('id', $userIds)->pluck('name', 'id');

            foreach ($recentDocs as $doc) {
                $activities[] = [
                    'type'      => 'upload',
                    'name'      => $names[$doc['user_id'] ?? null] ?? 'Usuário',
                    'action'    => 'Enviou um novo PDF',
                    'timestamp' => $doc['created_at'] ?? null,
                ];
            }
        }

        // Ordena por data (mais recentes primeiro) e limita às 10 últimas
        $activities = collect($activities)
            ->filter(fn ($a) => ! empty($a['timestamp']))
            ->sortByDesc('timestamp')
            ->take(10)
            ->values()
            ->all();

        return response()->json(['activities' => $activities]);
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

        $user    = User::findOrFail($id);
        $oldRole = $user->role;
        $user->update(['role' => $validated['role']]);

        // Auditoria (BS-022) — quem alterou (request->user) muda o papel de quem (resource)
        AuditLog::log(AuditLog::ROLE_CHANGED, [
            'resource_type' => 'user',
            'resource_id'   => $user->id,
            'metadata'      => [
                'target'   => $user->email,
                'old_role' => $oldRole,
                'new_role' => $validated['role'],
            ],
        ]);

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

        // Auditoria (BS-022)
        AuditLog::log(
            $validated['active'] ? AuditLog::USER_UNBLOCKED : AuditLog::USER_BLOCKED,
            ['resource_type' => 'user', 'resource_id' => $user->id, 'metadata' => ['target' => $user->email]],
        );

        return response()->json([
            'message' => $validated['active'] ? 'Usuário desbloqueado.' : 'Usuário bloqueado.',
            'user'    => $user,
        ]);
    }

    /**
     * Lista os logs de auditoria com filtros (BS-022).
     * Filtros: action, user_id, resource_type, from, to (datas ISO). Paginado.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::query()
            ->with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($resourceType = $request->input('resource_type')) {
            $query->where('resource_type', $resourceType);
        }
        if ($from = $request->input('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->input('to')) {
            $query->where('created_at', '<=', $to);
        }

        $perPage = min((int) $request->input('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
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

    /**
     * Busca os documentos recentes do AI Service (falha silenciosamente).
     */
    private function fetchAiDocuments(): array
    {
        try {
            $token   = request()->bearerToken();
            $baseUrl = config('services.ai_service.url', env('AI_SERVICE_URL', 'http://localhost:8001'));
            $res     = Http::withToken($token)
                ->timeout(3)
                ->get("{$baseUrl}/admin/documents", ['page' => 1, 'per_page' => 10]);

            return $res->successful() ? ($res->json('data') ?? []) : [];
        } catch (\Throwable) {
            return [];
        }
    }
}
