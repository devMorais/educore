<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status'  => 'ok',
        'message' => 'API funcionando',
        'version' => '1.0.0',
    ]);
});

Route::prefix('auth')->group(function () {
    // Rate limiting granular por endpoint (BS-021) — limiters nomeados em AppServiceProvider.
    // Cadastro/login são limitados por IP (usuário ainda não autenticado).
    Route::middleware('throttle:register')->post('/register', [AuthController::class, 'register']);
    Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);

    Route::get('/google',          [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);

    // Rotas autenticadas — limitadas por USUÁRIO (não por IP)
    Route::middleware('auth:sanctum')->group(function () {
        Route::middleware('throttle:auth-logout')->post('/logout', [AuthController::class, 'logout']);
        Route::middleware('throttle:auth-me')->get('/me', [AuthController::class, 'me']);

        // Throttle maior — chamado com frequência pelo AI Service (BS-004)
        Route::middleware('throttle:auth-verify')->get('/verify', [AuthController::class, 'verify']);

        // Refresh de token (BS-007)
        Route::middleware('throttle:auth-refresh')->post('/refresh', [AuthController::class, 'refresh']);

        // Status do rate limit do usuário (BS-021)
        Route::middleware('throttle:auth-me')->get('/rate-limit-status', [AuthController::class, 'rateLimitStatus']);
    });
});

// Rotas administrativas — apenas usuários com role=admin (BS-006 + BS-009)
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/stats',                       [AdminController::class, 'stats']);
    Route::get('/activity',                    [AdminController::class, 'activity']);
    Route::get('/users',                       [AdminController::class, 'users']);
    Route::patch('/users/{id}/role',           [AdminController::class, 'updateRole']);
    Route::patch('/users/{id}/status',         [AdminController::class, 'updateStatus']);
});
