<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Health check detalhado da plataforma (BS-024).
 *
 * GET /api/health         → database, ai_service, cache, queue
 * GET /api/system/status  → agrega Laravel + AI Service (FastAPI /health)
 *
 * Status geral: healthy | degraded | critical. 200 se healthy/degraded, 503 se critical.
 * Cada verificação externa tem timeout de 3s.
 */
class HealthController extends Controller
{
    private const VERSION = '1.0.0';
    private const TIMEOUT = 3; // segundos por verificação externa

    /** GET /api/health — componentes do backend Laravel. */
    public function health(): JsonResponse
    {
        $components = [
            'database'   => $this->checkDatabase(),
            'ai_service' => $this->checkAiService(),
            'cache'      => $this->checkCache(),
            'queue'      => $this->checkQueue(),
        ];

        // database fora = crítico; ai_service/cache/queue fora = degradado.
        return $this->respond($components, ['database']);
    }

    /** GET /api/system/status — agrega Laravel + AI Service num só lugar. */
    public function systemStatus(): JsonResponse
    {
        $laravel = [
            'database' => $this->checkDatabase(),
            'cache'    => $this->checkCache(),
            'queue'    => $this->checkQueue(),
        ];
        $laravelStatus = $this->aggregate($laravel, ['database']);

        $ai       = $this->fetchAiHealth();              // corpo completo do /health do FastAPI
        $aiStatus = $ai['status'] ?? 'unhealthy';        // healthy|degraded|critical|unhealthy

        // Pior status entre Laravel e AI Service (unhealthy do AI = critical do conjunto? não:
        // o Laravel está vivo; AI fora deixa o sistema 'degraded', não 'critical').
        $overall = $this->worst([
            $laravelStatus,
            in_array($aiStatus, ['healthy', 'degraded', 'critical'], true) ? $aiStatus : 'degraded',
        ]);
        // Exceção: se o próprio Laravel está critical (DB fora), aí sim é critical.
        if ($laravelStatus === 'critical') {
            $overall = 'critical';
        }

        return response()->json([
            'status'         => $overall,
            'version'        => self::VERSION,
            'uptime_seconds' => $this->uptime(),
            'timestamp'      => now()->toIso8601String(),
            'services'       => [
                'laravel'    => ['status' => $laravelStatus, 'components' => $laravel],
                'ai_service' => $ai,
            ],
        ], $overall === 'critical' ? 503 : 200);
    }

    // ─────────────────────────────────────── verificações
    private function checkDatabase(): array
    {
        $start = microtime(true);
        try {
            DB::select('SELECT 1');

            return ['status' => 'healthy', 'latency_ms' => $this->ms($start)];
        } catch (\Throwable $e) {
            return ['status' => 'unhealthy', 'error' => substr($e->getMessage(), 0, 160)];
        }
    }

    private function checkCache(): array
    {
        try {
            Cache::put('health:ping', '1', 10);
            $ok = Cache::get('health:ping') === '1';

            return ['status' => $ok ? 'healthy' : 'degraded', 'store' => config('cache.default')];
        } catch (\Throwable $e) {
            return ['status' => 'unhealthy', 'error' => substr($e->getMessage(), 0, 160)];
        }
    }

    private function checkQueue(): array
    {
        try {
            $connection = config('queue.default');
            $pending = $connection === 'database' ? DB::table('jobs')->count() : null;

            $failed = 0;
            try {
                $failed = DB::table('failed_jobs')->count();
            } catch (\Throwable) {
                // tabela failed_jobs pode não existir em algumas instalações
            }

            return [
                'status'     => 'healthy',
                'connection' => $connection,
                'pending'    => $pending,
                'failed'     => $failed,
            ];
        } catch (\Throwable $e) {
            return ['status' => 'degraded', 'error' => substr($e->getMessage(), 0, 160)];
        }
    }

    private function checkAiService(): array
    {
        $ai = $this->fetchAiHealth();
        $map = ['healthy' => 'healthy', 'degraded' => 'degraded', 'critical' => 'unhealthy'];
        $aiStatus = $ai['status'] ?? 'unhealthy';

        return [
            'status'    => $map[$aiStatus] ?? 'unhealthy',
            'ai_status' => $aiStatus,
        ];
    }

    /** Chama o GET /health do AI Service (FastAPI) e devolve o corpo. */
    private function fetchAiHealth(): array
    {
        try {
            $url = config('services.ai_service.url', env('AI_SERVICE_URL', 'http://localhost:8001'));
            // Aceita 503 (o AI service responde 503 quando 'critical') sem lançar exceção.
            $res  = Http::timeout(self::TIMEOUT)->get("{$url}/health");
            $body = $res->json();

            if (is_array($body) && isset($body['status'])) {
                return $body;
            }

            return ['status' => 'unhealthy', 'http_status' => $res->status()];
        } catch (\Throwable $e) {
            return ['status' => 'unhealthy', 'error' => substr($e->getMessage(), 0, 160)];
        }
    }

    // ─────────────────────────────────────── helpers
    private function respond(array $components, array $criticalKeys): JsonResponse
    {
        $overall = $this->aggregate($components, $criticalKeys);

        return response()->json([
            'service'        => 'EduCore Laravel API',
            'status'         => $overall,
            'version'        => self::VERSION,
            'uptime_seconds' => $this->uptime(),
            'timestamp'      => now()->toIso8601String(),
            'components'     => $components,
        ], $overall === 'critical' ? 503 : 200);
    }

    private function aggregate(array $components, array $criticalKeys): string
    {
        foreach ($criticalKeys as $k) {
            if (($components[$k]['status'] ?? null) === 'unhealthy') {
                return 'critical';
            }
        }
        foreach ($components as $c) {
            if (in_array($c['status'] ?? null, ['unhealthy', 'degraded'], true)) {
                return 'degraded';
            }
        }

        return 'healthy';
    }

    private function worst(array $statuses): string
    {
        if (in_array('critical', $statuses, true)) {
            return 'critical';
        }
        if (in_array('degraded', $statuses, true)) {
            return 'degraded';
        }

        return 'healthy';
    }

    /** Proxy de uptime: tempo desde a 1ª chamada (≈ desde o último deploy/cache:clear). */
    private function uptime(): int
    {
        $boot = Cache::rememberForever('health:boot_time', fn () => now()->timestamp);

        return max(0, now()->timestamp - (int) $boot);
    }

    private function ms(float $start): float
    {
        return round((microtime(true) - $start) * 1000, 1);
    }
}
