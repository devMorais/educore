<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

// BS-024: health check detalhado (público para monitores externos; throttled)
Route::get('/health', [HealthController::class, 'health'])->middleware('throttle:30,1');
Route::get('/system/status', [HealthController::class, 'systemStatus'])->middleware('throttle:30,1');

Route::prefix('auth')->group(function () {
    // Rate limiting granular por endpoint (BS-021) — limiters nomeados em AppServiceProvider.
    // Cadastro/login são limitados por IP (usuário ainda não autenticado).
    Route::middleware('throttle:register')->post('/register', [AuthController::class, 'register']);
    Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);

    Route::get('/google',          [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);

    // ── BS-023: verificação de email ──
    // Link do email (assinado) — acessível SEM login; `signed` valida assinatura + expiração.
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    // Rotas autenticadas — limitadas por USUÁRIO (não por IP)
    Route::middleware('auth:sanctum')->group(function () {
        Route::middleware('throttle:auth-logout')->post('/logout', [AuthController::class, 'logout']);
        Route::middleware('throttle:auth-me')->get('/me', [AuthController::class, 'me']);

        // Reenvio do email de verificação (BS-023)
        Route::middleware('throttle:auth-me')->post('/email/resend', [AuthController::class, 'resendVerification']);

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
    // Auditoria de acesso e ações (BS-022) — com filtros
    Route::get('/audit-logs',                  [AdminController::class, 'auditLogs']);
    // Turmas — visão geral de todas as turmas de todos os professores (D-01)
    Route::get('/classes',                     [ClassController::class, 'adminIndex']);
});

// Rotas de turmas (D-01) — professor ou admin autenticados.
// Isolamento entre professores é garantido dentro do ClassController
// (cada professor só vê/edita as próprias turmas; admin vê todas).
Route::prefix('classes')->middleware(['auth:sanctum', 'role:professor,admin'])->group(function () {
    Route::get('/',                            [ClassController::class, 'index']);
    Route::post('/',                           [ClassController::class, 'store']);
    Route::get('/{id}',                        [ClassController::class, 'show']);
    Route::put('/{id}',                        [ClassController::class, 'update']);
    Route::delete('/{id}',                     [ClassController::class, 'destroy']);
    Route::get('/{classId}/students',          [ClassController::class, 'students']);
    Route::post('/{classId}/enroll',           [ClassController::class, 'enroll']);
    Route::delete('/{classId}/enroll/{userId}', [ClassController::class, 'unenroll']);
});
