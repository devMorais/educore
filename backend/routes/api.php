<?php

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
    Route::post('/register',           [AuthController::class, 'register']);
    Route::post('/login',              [AuthController::class, 'login']);
    Route::get('/google',              [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback',     [AuthController::class, 'handleGoogleCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });
});
