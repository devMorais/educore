<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class UserBlockingTest extends TestCase
{
    use RefreshDatabase;

    public function test_blocking_user_revokes_all_tokens_and_stops_authenticating(): void
    {
        $admin  = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'student']);
        $token  = $target->createToken('web-session-test')->plainTextToken;

        // Confirma que o token funciona antes do bloqueio.
        $this->withHeader('Authorization', "Bearer {$token}")
             ->getJson('/api/auth/me')
             ->assertStatus(200);

        $this->actingAs($admin, 'sanctum')
             ->patchJson("/api/admin/users/{$target->id}/status", ['active' => false])
             ->assertStatus(200);

        $this->assertSame('blocked', $target->fresh()->status);
        $this->assertSame(0, $target->tokens()->count());

        // O guard 'sanctum' cacheia o usuário resolvido dentro do mesmo teste
        // (RequestGuard::$user memoizado) — sem isso, a chamada abaixo reusaria
        // a resolução bem-sucedida de cima em vez de re-validar o token contra
        // o banco (que agora está sem nenhum token para esse usuário).
        $this->app['auth']->forgetGuards();

        // O MESMO token que funcionava antes agora não autentica mais.
        $this->withHeader('Authorization', "Bearer {$token}")
             ->getJson('/api/auth/me')
             ->assertStatus(401);
    }

    public function test_blocked_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('senha-correta-123'),
            'status'   => 'blocked',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-correta-123',
        ]);

        $response->assertStatus(403);
        $this->assertArrayNotHasKey('access_token', $response->json());
    }

    public function test_verify_email_never_reactivates_or_verifies_blocked_user(): void
    {
        $user = User::factory()->unverified()->create(['status' => 'blocked']);

        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $response = $this->getJson($url);

        $response->assertStatus(403);

        $fresh = $user->fresh();
        $this->assertSame('blocked', $fresh->status);
        $this->assertNull($fresh->email_verified_at);
    }

    public function test_unblocking_user_restores_login_ability(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user  = User::factory()->create([
            'password' => bcrypt('senha-correta-123'),
            'status'   => 'blocked',
        ]);

        $this->actingAs($admin, 'sanctum')
             ->patchJson("/api/admin/users/{$user->id}/status", ['active' => true])
             ->assertStatus(200);

        $this->assertSame('active', $user->fresh()->status);

        // actingAs(..., 'sanctum') chama Auth::shouldUse('sanctum'), trocando o
        // guard PADRÃO do teste — sem restaurar, o Auth::attempt() dentro de
        // login() bateria no guard errado (RequestGuard não implementa attempt()).
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web');

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-correta-123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['user', 'access_token']);
    }

    public function test_me_rejects_blocked_user_even_with_a_still_valid_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('web-session-test')->plainTextToken;

        // Bloqueia direto no banco (sem passar pelo fluxo de admin), simulando
        // um cenário em que o token não foi revogado — defesa extra do me().
        $user->update(['status' => 'blocked']);

        $this->withHeader('Authorization', "Bearer {$token}")
             ->getJson('/api/auth/me')
             ->assertStatus(403);
    }

    public function test_verify_rejects_blocked_user_even_with_a_still_valid_token(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('web-session-test')->plainTextToken;

        $user->update(['status' => 'blocked']);

        $this->withHeader('Authorization', "Bearer {$token}")
             ->getJson('/api/auth/verify')
             ->assertStatus(403);
    }

    public function test_active_status_is_the_default_for_new_users(): void
    {
        $user = User::factory()->create();

        // create() não repopula automaticamente colunas com DEFAULT do banco
        // no objeto em memória — refresh() busca o valor real persistido.
        $this->assertSame('active', $user->refresh()->status);
    }
}
