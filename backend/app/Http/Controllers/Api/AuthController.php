<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
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
            'role'     => User::count() === 0 ? 'admin' : 'student',
        ]);

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::warning('Falha ao enviar email de verificação no registro: ' . $e->getMessage());
        }

        $token     = $user->createToken('web-session-' . now()->format('YmdHis'));
        $expiresAt = $token->accessToken->expires_at?->toIso8601String()
            ?? now()->addMinutes(config('sanctum.expiration', 1440))->toIso8601String();

        AuditLog::log(AuditLog::REGISTER, [
            'user_id'       => $user->id,
            'resource_type' => 'user',
            'resource_id'   => $user->id,
            'metadata'      => ['email' => $user->email, 'role' => $user->role],
        ]);

        return response()->json([
            'user'         => $user,
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $expiresAt,
        ], 201);
    }

    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'Usuário não encontrado.'], 404);
        }

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Link de verificação inválido.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email já verificado.', 'user' => $user]);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return response()->json([
            'message' => 'Email verificado com sucesso!',
            'user'    => $user,
        ]);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Seu email já está verificado.']);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::warning('Reenvio de email de verificação falhou: ' . $e->getMessage());

            return response()->json([
                'message' => 'Não foi possível reenviar agora. Tente novamente mais tarde.',
            ], 503);
        }

        return response()->json(['message' => 'Email de verificação reenviado.']);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            AuditLog::log(AuditLog::LOGIN_FAILED, [
                'metadata' => ['email' => $request->input('email')],
            ]);

            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $user = Auth::user();
        $user->update(['last_login_at' => now()]);

        AuditLog::log(AuditLog::LOGIN, ['user_id' => $user->id]);

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
        $user = $request->user();

        AuditLog::log(AuditLog::LOGOUT, ['user_id' => $user->id]);

        $token = $user->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->user()->currentAccessToken()->delete();

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
        $user = $request->user();
        $key  = "auth.me.v1.{$user->id}";
        $hit  = Cache::has($key);
        $data = Cache::remember($key, 30, fn () => $user);

        return response()->json($data)->header('X-Cache', $hit ? 'HIT' : 'MISS');
    }

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

    public function rateLimitStatus(Request $request): JsonResponse
    {
        $user    = $request->user();
        $userKey = $user?->id ? 'user:' . $user->id : 'ip:' . $request->ip();

        $limiters = [
            'me'          => ['auth-me',      'me:' . $userKey,      (int) config('ratelimit.me_per_minute'),        'minuto'],
            'verify'      => ['auth-verify',  'verify:' . $userKey,  (int) config('ratelimit.verify_per_minute'),    'minuto'],
            'refresh'     => ['auth-refresh', 'refresh:' . $userKey, (int) config('ratelimit.refresh_per_minute'),   'minuto'],
            'logout'      => ['auth-logout',  'logout:' . $userKey,  (int) config('ratelimit.logout_per_minute'),    'minuto'],
            'generations' => ['generations',  'gen:' . $userKey,     (int) config('ratelimit.generations_per_hour'), 'hora'],
            'export'      => ['export',       'export:' . $userKey,  (int) config('ratelimit.export_per_hour'),      'hora'],
        ];

        $status = [];
        foreach ($limiters as $categoria => [$nome, $by, $limite, $janela]) {
            $key      = md5($nome . $by);
            $restante = max(0, RateLimiter::remaining($key, $limite));

            $status[$categoria] = [
                'limit'        => $limite,
                'window'       => $janela,
                'used'         => max(0, $limite - $restante),
                'remaining'    => $restante,
                'reset_in_sec' => RateLimiter::availableIn($key),
            ];
        }

        return response()->json([
            'user_id' => $user?->id,
            'store'   => config('cache.default'),
            'limits'  => $status,
            'note'    => 'generations/export são aplicados no AI Service (FastAPI); aqui está a política canônica.',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        AuditLog::log(AuditLog::PASSWORD_RESET_REQUESTED, [
            'metadata' => ['email' => $request->input('email')],
        ]);

        return response()->json([
            'message' => 'Se o e-mail informado estiver cadastrado, você receberá um link de redefinição em instantes.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                $user->tokens()->delete();

                AuditLog::log(AuditLog::PASSWORD_RESET_COMPLETED, [
                    'user_id' => $user->id,
                ]);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Token inválido ou expirado.',
            ], 422);
        }

        return response()->json([
            'message' => 'Senha redefinida com sucesso.',
        ]);
    }

    public function redirectToGoogle(): JsonResponse
    {
        $state = Str::random(40);
        Cache::put("oauth_state_{$state}", true, 600);

        $url = Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url, 'state' => $state]);
    }

    public function handleGoogleCallback(Request $request): JsonResponse
    {
        $state = $request->query('state', '');
        if (!Cache::has("oauth_state_{$state}")) {
            return response()->json([
                'message' => 'State inválido ou expirado. Tente novamente.',
            ], 422);
        }

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

        if (!User::where('role', 'admin')->exists()) {
            $user->update(['role' => 'admin']);
        }

        AuditLog::log(
            $user->wasRecentlyCreated ? AuditLog::REGISTER : AuditLog::LOGIN,
            ['user_id' => $user->id, 'metadata' => ['provider' => 'google']],
        );

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