<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            // Primeiro usuário cadastrado recebe role=admin automaticamente (BS-006)
            'role'     => User::count() === 0 ? 'admin' : 'student',
        ]);

        $token     = $user->createToken('web-session-' . now()->format('YmdHis'));
        $expiresAt = $token->accessToken->expires_at?->toIso8601String()
            ?? now()->addMinutes(config('sanctum.expiration', 1440))->toIso8601String();

        return response()->json([
            'user'         => $user,
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $user = Auth::user();

        // Registra o último login para rastrear usuários ativos (BS-009)
        $user->update(['last_login_at' => now()]);

        $token     = $user->createToken('web-session-' . now()->format('YmdHis'));
        $expiresAt = $token->accessToken->expires_at?->toIso8601String()
            ?? now()->addMinutes(config('sanctum.expiration', 1440))->toIso8601String();

        return response()->json([
            'user'         => $user,
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    /**
     * Renova o token de acesso (BS-007).
     * Revoga o token atual e emite um novo com expiração de 24 horas.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoga o token atual
        $request->user()->currentAccessToken()->delete();

        // Emite novo token
        $token     = $user->createToken('web-session-' . now()->format('YmdHis'));
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 1440))->toIso8601String();

        return response()->json([
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Verifica o token Sanctum e retorna dados do usuário para o AI Service.
     * Expõe apenas campos seguros — password e remember_token são omitidos (BS-004).
     */
    public function verify(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user_id'           => $user->id,
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'role'              => $user->role ?? 'student',
            'avatar'            => $user->avatar,
            'email_verified_at' => $user->email_verified_at,
        ]);
    }

    /**
     * Gera URL de autenticação Google com state anti-CSRF (BS-008).
     */
    public function redirectToGoogle(): JsonResponse
    {
        // Gera state aleatório e salva no cache por 10 minutos (BS-008)
        $state = Str::random(40);
        Cache::put("oauth_state_{$state}", true, 600);

        $url = Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url, 'state' => $state]);
    }

    /**
     * Processa callback do Google validando o state anti-CSRF (BS-008).
     */
    public function handleGoogleCallback(Request $request): JsonResponse
    {
        // Valida o state para prevenir CSRF (BS-008)
        $state = $request->query('state', '');
        if (!Cache::has("oauth_state_{$state}")) {
            return response()->json([
                'message' => 'State inválido ou expirado. Tente novamente.',
            ], 422);
        }

        // Invalida o state (uso único)
        Cache::forget("oauth_state_{$state}");

        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::updateOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name'              => $googleUser->getName(),
                'google_id'         => $googleUser->getId(),
                'avatar'            => $googleUser->getAvatar(),
                'password'          => Hash::make(Str::random(24)),
                'email_verified_at' => now(),
                'last_login_at'     => now(),
            ]
        );

        // Primeiro usuário via Google também vira admin se não houver admin
        if (!User::where('role', 'admin')->exists()) {
            $user->update(['role' => 'admin']);
        }

        $token     = $user->createToken('web-session-' . now()->format('YmdHis'));
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 1440))->toIso8601String();

        return response()->json([
            'user'         => $user,
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt,
        ]);
    }
}
