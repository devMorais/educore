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
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login',    [AuthController::class, 'login']);
    });

    Route::get('/google',          [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // Throttle maior para suportar verificações frequentes do AI Service (BS-004)
    Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
        Route::get('/verify', [AuthController::class, 'verify']);
    });

    // Refresh de token (BS-007)
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::post('/refresh', [AuthController::class, 'refresh']);
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
});
