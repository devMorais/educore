<?php

/*
|--------------------------------------------------------------------------
| Rate Limiting Granular (BS-021)
|--------------------------------------------------------------------------
|
| Limites por endpoint, sobrescrevíveis por variáveis de ambiente.
|
| IMPORTANTE: leia os limites SEMPRE via config('ratelimit.*'), NUNCA via
| env() fora deste arquivo — com `php artisan config:cache` (produção) o
| env() retorna null e os limites quebrariam. Aqui dentro env() é seguro.
|
| Para alterar em produção: defina a env e rode `php artisan config:cache`.
|
*/

return [

    // ── Auth não autenticado (chave = IP) ──
    'register_per_hour'  => (int) env('RATE_REGISTER_PER_HOUR', 5),    // cadastro: 5/h por IP
    'login_per_minute'   => (int) env('RATE_LOGIN_PER_MINUTE', 10),    // login: 10/min por IP

    // ── Auth autenticado (chave = user id) ──
    'me_per_minute'      => (int) env('RATE_ME_PER_MINUTE', 120),      // /auth/me: 120/min por usuário
    'verify_per_minute'  => (int) env('RATE_VERIFY_PER_MINUTE', 120),  // /auth/verify (chamado pelo AI Service)
    'refresh_per_minute' => (int) env('RATE_REFRESH_PER_MINUTE', 60),  // /auth/refresh
    'logout_per_minute'  => (int) env('RATE_LOGOUT_PER_MINUTE', 60),   // /auth/logout

    // ── D-04: Notificações in-app (chave = user id) ──
    'notifications_per_minute' => (int) env('RATE_NOTIFICATIONS_PER_MINUTE', 60), // /notifications/*: 60/min por usuário

    // ── Geração/Export (chave = user id) ──
    // Política CANÔNICA do produto. A aplicação real desses limites acontece no
    // AI Service (FastAPI/slowapi), pois os endpoints de geração/export vivem lá.
    // Mantemos aqui para o /auth/rate-limit-status reportar e para um eventual
    // proxy no Laravel. Mantenha os valores do slowapi alinhados a estes.
    'generations_per_hour' => (int) env('RATE_GENERATIONS_PER_HOUR', 20), // geração: 20/h por usuário
    'export_per_hour'      => (int) env('RATE_EXPORT_PER_HOUR', 50),      // export: 50/h por usuário

    /*
    | Store do rate limiter (grátis x pago)
    |--------------------------------------------------------------------------
    | O RateLimiter usa o cache padrão (config cache.default).
    |   GRÁTIS (atual): CACHE_STORE=database — funciona no Hostinger, sem extras.
    |   ESCALA (pago/free-tier): Redis — atômico e rápido p/ rate limit distribuído.
    |     Opções: Upstash (free tier serverless) ou Redis Cloud.
    |     Para ativar: CACHE_STORE=redis + REDIS_HOST/PORT/PASSWORD no .env,
    |     OU dedique só o rate limit ao Redis com 'limiter' => 'redis' em config/cache.php.
    */

];
