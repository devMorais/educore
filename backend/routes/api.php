<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

// BS-024: health check detalhado (público para monitores externos; throttled)
Route::get('/health', [HealthController::class, 'health'])->middleware('throttle:30,1');
Route::get('/system/status', [HealthController::class, 'systemStatus'])->middleware('throttle:30,1');

Route::prefix('auth')->group(function () {
    Route::middleware('throttle:register')->post('/register', [AuthController::class, 'register']);
    Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);

    // D-02: recuperação de senha — sem login, limitadas por IP
    Route::middleware('throttle:forgot-password')->post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::middleware('throttle:reset-password')->post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/google',          [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::middleware('throttle:auth-logout')->post('/logout', [AuthController::class, 'logout']);
        Route::middleware('throttle:auth-me')->get('/me', [AuthController::class, 'me']);
        Route::middleware('throttle:auth-me')->post('/email/resend', [AuthController::class, 'resendVerification']);
        Route::middleware('throttle:auth-verify')->get('/verify', [AuthController::class, 'verify']);
        Route::middleware('throttle:auth-refresh')->post('/refresh', [AuthController::class, 'refresh']);
        Route::middleware('throttle:auth-me')->get('/rate-limit-status', [AuthController::class, 'rateLimitStatus']);
    });
});

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/stats',                       [AdminController::class, 'stats']);
    Route::get('/activity',                    [AdminController::class, 'activity']);
    Route::get('/users',                       [AdminController::class, 'users']);
    Route::patch('/users/{id}/role',           [AdminController::class, 'updateRole']);
    Route::patch('/users/{id}/status',         [AdminController::class, 'updateStatus']);
    Route::get('/audit-logs',                  [AdminController::class, 'auditLogs']);
});