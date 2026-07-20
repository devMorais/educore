<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['user', 'access_token', 'token_type']);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_register_requires_valid_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'not-an-email',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Another User',
            'email'                 => 'existing@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email'    => 'login@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'login@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['user', 'access_token', 'token_type']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'login@example.com',
            'password' => bcrypt('correct-password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'login@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
                 ->assertJsonFragment(['message' => 'Credenciais inválidas.']);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/auth/logout');

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Logout realizado com sucesso.']);
    }

    // ── D-02: Recuperação de senha ──

    public function test_forgot_password_sends_reset_notification_and_never_reveals_if_email_exists(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'reset@example.com']);

        $existente = $this->postJson('/api/auth/forgot-password', [
            'email' => 'reset@example.com',
        ]);
        $inexistente = $this->postJson('/api/auth/forgot-password', [
            'email' => 'naoexiste@example.com',
        ]);

        // Mesma resposta genérica nos dois casos — não revela se o email existe.
        $existente->assertStatus(200);
        $inexistente->assertStatus(200);
        $this->assertSame($existente->json('message'), $inexistente->json('message'));

        Notification::assertSentToTimes($user, ResetPasswordNotification::class, 1);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'reset@example.com']);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'naoexiste@example.com']);
    }

    public function test_full_password_reset_flow_and_token_is_single_use(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email'    => 'resetflow@example.com',
            'password' => bcrypt('senha-antiga-123'),
        ]);

        $this->postJson('/api/auth/forgot-password', ['email' => 'resetflow@example.com'])
             ->assertStatus(200);

        $token = null;
        Notification::assertSentTo(
            $user,
            ResetPasswordNotification::class,
            function (ResetPasswordNotification $notification) use (&$token) {
                $token = $notification->token;
                return true;
            }
        );
        $this->assertNotNull($token);

        // Redefine a senha com o token recebido.
        $reset = $this->postJson('/api/auth/reset-password', [
            'token'                 => $token,
            'email'                 => 'resetflow@example.com',
            'password'              => 'senha-nova-456',
            'password_confirmation' => 'senha-nova-456',
        ]);
        $reset->assertStatus(200);

        // Login com a senha nova funciona.
        $this->postJson('/api/auth/login', [
            'email'    => 'resetflow@example.com',
            'password' => 'senha-nova-456',
        ])->assertStatus(200);

        // Login com a senha antiga não funciona mais.
        $this->postJson('/api/auth/login', [
            'email'    => 'resetflow@example.com',
            'password' => 'senha-antiga-123',
        ])->assertStatus(401);

        // O mesmo token não pode ser usado uma segunda vez.
        $reuso = $this->postJson('/api/auth/reset-password', [
            'token'                 => $token,
            'email'                 => 'resetflow@example.com',
            'password'              => 'outra-senha-789',
            'password_confirmation' => 'outra-senha-789',
        ]);
        $reuso->assertStatus(422);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        User::factory()->create(['email' => 'tokeninvalido@example.com']);

        $response = $this->postJson('/api/auth/reset-password', [
            'token'                 => 'token-que-nao-existe',
            'email'                 => 'tokeninvalido@example.com',
            'password'              => 'nova-senha-123',
            'password_confirmation' => 'nova-senha-123',
        ]);

        $response->assertStatus(422);
    }

    public function test_reset_password_requires_matching_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/reset-password', [
            'token'                 => 'qualquer-token',
            'email'                 => 'reset@example.com',
            'password'              => 'nova-senha-123',
            'password_confirmation' => 'diferente-123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }
}
