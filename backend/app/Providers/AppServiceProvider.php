<?php

namespace App\Providers;

use App\Events\AuditableEvent;
use App\Listeners\RecordAuditLog;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configurarRateLimiters();

        // Auditoria assíncrona (BS-022): evento -> listener (fila) -> audit_logs
        Event::listen(AuditableEvent::class, RecordAuditLog::class);
    }

    /**
     * Rate limiters nomeados, granulares por usuário/IP e endpoint (BS-021).
     *
     * Aplicados nas rotas via middleware `throttle:<nome>` (routes/api.php).
     * Limites vêm de config/ratelimit.php (env-overridable, à prova de config:cache).
     * O AI Service complementa com seus próprios limites (slowapi).
     */
    protected function configurarRateLimiters(): void
    {
        // Resposta 429 padronizada: corpo JSON com Retry-After e tempo de espera.
        $resposta429 = function (Request $request, array $headers) {
            $retry = (int) ($headers['Retry-After'] ?? 60);

            return response()->json([
                'message'           => 'Limite de requisições excedido. Aguarde antes de tentar novamente.',
                'retry_after'       => $retry,
                'retry_after_human' => $retry >= 60 ? (int) ceil($retry / 60) . ' min' : $retry . 's',
            ], 429, $headers);
        };

        // Identificador por USUÁRIO autenticado; cai para IP se anônimo.
        $porUsuario = fn (Request $r): string => $r->user()?->id
            ? 'user:' . $r->user()->id
            : 'ip:' . $r->ip();

        // ── Auth não autenticado: chave por IP ──
        RateLimiter::for('register', fn (Request $r) => Limit::perHour(
            (int) config('ratelimit.register_per_hour')
        )->by('register:ip:' . $r->ip())->response($resposta429));

        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(
            (int) config('ratelimit.login_per_minute')
        )->by('login:ip:' . $r->ip())->response($resposta429));

        // ── Auth autenticado: chave por usuário ──
        RateLimiter::for('auth-me', fn (Request $r) => Limit::perMinute(
            (int) config('ratelimit.me_per_minute')
        )->by('me:' . $porUsuario($r))->response($resposta429));

        RateLimiter::for('auth-verify', fn (Request $r) => Limit::perMinute(
            (int) config('ratelimit.verify_per_minute')
        )->by('verify:' . $porUsuario($r))->response($resposta429));

        RateLimiter::for('auth-refresh', fn (Request $r) => Limit::perMinute(
            (int) config('ratelimit.refresh_per_minute')
        )->by('refresh:' . $porUsuario($r))->response($resposta429));

        RateLimiter::for('auth-logout', fn (Request $r) => Limit::perMinute(
            (int) config('ratelimit.logout_per_minute')
        )->by('logout:' . $porUsuario($r))->response($resposta429));

        // ── D-04: Notificações in-app: chave por usuário ──
        RateLimiter::for('notifications', fn (Request $r) => Limit::perMinute(
            (int) config('ratelimit.notifications_per_minute')
        )->by('notifications:' . $porUsuario($r))->response($resposta429));

        // ── Geração/Export: chave por usuário (política canônica; aplicada no AI Service) ──
        RateLimiter::for('generations', fn (Request $r) => Limit::perHour(
            (int) config('ratelimit.generations_per_hour')
        )->by('gen:' . $porUsuario($r))->response($resposta429));

        RateLimiter::for('export', fn (Request $r) => Limit::perHour(
            (int) config('ratelimit.export_per_hour')
        )->by('export:' . $porUsuario($r))->response($resposta429));
    }
}
