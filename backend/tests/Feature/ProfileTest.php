<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_authenticated_user_can_update_name(): void
    {
        $user = User::factory()->create(['name' => 'Nome Antigo']);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/profile', ['name' => 'Nome Novo']);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Nome Novo']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Nome Novo']);
    }

    public function test_authenticated_user_can_upload_avatar(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg')->size(500);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/profile', [
                             'name'   => $user->name,
                             'avatar' => $file,
                         ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertNotNull($user->avatar);
        $this->assertStringContainsString('/storage/avatars/', $user->avatar);

        Storage::disk('public')->assertExists('avatars/' . basename($user->avatar));
    }

    public function test_avatar_upload_rejects_non_image_file(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('documento.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/profile', [
                             'name'   => $user->name,
                             'avatar' => $file,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['avatar']);
    }

    public function test_avatar_upload_rejects_file_larger_than_2mb(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg')->size(3000);

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/profile', [
                             'name'   => $user->name,
                             'avatar' => $file,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['avatar']);
    }

    public function test_old_local_avatar_is_removed_when_new_one_is_uploaded(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/profile', [
            'name'   => $user->name,
            'avatar' => UploadedFile::fake()->image('primeiro.jpg')->size(500),
        ])->assertStatus(200);

        $user->refresh();
        $oldPath = 'avatars/' . basename($user->avatar);
        Storage::disk('public')->assertExists($oldPath);

        $this->actingAs($user, 'sanctum')->postJson('/api/profile', [
            'name'   => $user->name,
            'avatar' => UploadedFile::fake()->image('segundo.jpg')->size(500),
        ])->assertStatus(200);

        Storage::disk('public')->assertMissing($oldPath);
    }

    public function test_external_avatar_url_is_not_deleted_from_storage(): void
    {
        // Simula um usuário logado via Google, cujo avatar é uma URL externa.
        $user = User::factory()->create(['avatar' => 'https://lh3.googleusercontent.com/a/foo123']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/profile', [
            'name'   => $user->name,
            'avatar' => UploadedFile::fake()->image('novo.jpg')->size(500),
        ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertStringContainsString('/storage/avatars/', $user->avatar);
    }

    public function test_profile_update_requires_authentication(): void
    {
        $response = $this->postJson('/api/profile', ['name' => 'Sem Login']);

        $response->assertStatus(401);
    }

    public function test_name_is_required(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/profile', ['name' => '']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name']);
    }

    public function test_profile_update_persists_after_relogin(): void
    {
        $user = User::factory()->create([
            'name'     => 'Nome Antigo',
            'password' => bcrypt('senha-correta-123'),
        ]);

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/profile', [
                 'name'   => 'Nome Depois Do Logout',
                 'avatar' => UploadedFile::fake()->image('avatar.jpg')->size(500),
             ])
             ->assertStatus(200);

        // actingAs(..., 'sanctum') muda o guard PADRÃO do teste — sem restaurar,
        // o Auth::attempt() dentro de login() bateria no guard errado
        // (RequestGuard não implementa attempt()). Ver CLAUDE.md / D-09.
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web');

        // Simula logout/login: novo login não deve reverter os dados salvos.
        $login = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'senha-correta-123',
        ]);

        $login->assertStatus(200)
              ->assertJsonPath('user.name', 'Nome Depois Do Logout');

        $this->assertStringContainsString('/storage/avatars/', $login->json('user.avatar'));
    }
}
