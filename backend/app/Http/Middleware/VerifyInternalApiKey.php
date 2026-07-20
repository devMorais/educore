<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * D-04: protege rotas internas (chamadas serviço-a-serviço, ex: webhook do
 * ai-service) com uma chave compartilhada simples via header — não é uma
 * rota de usuário, então não passa por auth:sanctum.
 */
class VerifyInternalApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $chaveEsperada = config('services.internal.api_key');
        $chaveRecebida = (string) $request->header('X-Internal-Key');

        if (empty($chaveEsperada) || ! hash_equals((string) $chaveEsperada, $chaveRecebida)) {
            return response()->json(['message' => 'Não autorizado.'], 401);
        }

        return $next($request);
    }
}
