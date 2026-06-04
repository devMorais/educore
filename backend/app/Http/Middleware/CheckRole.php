<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifica se o usuário autenticado possui um dos papéis necessários.
 * Uso nas rotas: middleware('role:admin') ou middleware('role:admin,professor')
 */
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Acesso negado. Permissão insuficiente.'], 403);
        }

        return $next($request);
    }
}
