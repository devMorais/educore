<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // statefulApi() removido — EduCore usa Bearer tokens, não session/cookies
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Alias para controle de papéis (BS-006)
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $_, $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
        // Validação em rotas /api/* sempre retorna 422 JSON, nunca redireciona
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
            }
        });
    })->create();
