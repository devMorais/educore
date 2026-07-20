<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_own_notifications(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/notifications');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_notification_listing_isolates_between_users(): void
    {
        $user       = User::factory()->create();
        $outroUser  = User::factory()->create();
        Notification::factory()->count(2)->create(['user_id' => $user->id]);
        Notification::factory()->count(5)->create(['user_id' => $outroUser->id]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/notifications');

        $response->assertStatus(200)->assertJsonCount(2);
    }

    public function test_notification_listing_is_paginated(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(25)->create(['user_id' => $user->id]);

        $firstPage = $this->actingAs($user, 'sanctum')->getJson('/api/notifications');
        $firstPage->assertStatus(200)->assertJsonCount(20);

        $secondPage = $this->actingAs($user, 'sanctum')->getJson('/api/notifications?page=2');
        $secondPage->assertStatus(200)->assertJsonCount(5);
    }

    public function test_unread_count_reflects_only_unread_notifications(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(2)->create(['user_id' => $user->id, 'read_at' => null]);
        Notification::factory()->count(4)->create(['user_id' => $user->id, 'read_at' => now()]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/notifications/unread-count');

        $response->assertStatus(200)->assertJson(['count' => 2]);
    }

    public function test_user_can_mark_single_notification_as_read(): void
    {
        $user         = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $user->id, 'read_at' => null]);

        $response = $this->actingAs($user, 'sanctum')
                         ->patchJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200)->assertJsonFragment(['read' => true]);
        $this->assertDatabaseHas('notifications', ['id' => $notification->id]);
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user         = User::factory()->create();
        $outroUser    = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $outroUser->id, 'read_at' => null]);

        $response = $this->actingAs($user, 'sanctum')
                         ->patchJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(404);
        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->create(['user_id' => $user->id, 'read_at' => null]);

        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/notifications/read-all');

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertSame(0, Notification::where('user_id', $user->id)->unread()->count());
    }

    public function test_notifications_require_authentication(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(401);
    }

    public function test_internal_endpoint_creates_notification_with_valid_key(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/internal/notifications', [
            'user_id' => $user->id,
            'type'    => 'document_completed',
            'title'   => 'Documento processado',
            'body'    => 'Seu PDF terminou de processar.',
            'data'    => ['document_id' => 42],
        ], ['X-Internal-Key' => 'test-internal-key']);

        $response->assertStatus(201);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type'    => 'document_completed',
            'title'   => 'Documento processado',
        ]);
    }

    public function test_internal_endpoint_rejects_request_without_valid_key(): void
    {
        $user = User::factory()->create();

        $semChave = $this->postJson('/api/internal/notifications', [
            'user_id' => $user->id,
            'type'    => 'document_completed',
            'title'   => 'Documento processado',
            'body'    => 'Seu PDF terminou de processar.',
        ]);
        $semChave->assertStatus(401);

        $chaveErrada = $this->postJson('/api/internal/notifications', [
            'user_id' => $user->id,
            'type'    => 'document_completed',
            'title'   => 'Documento processado',
            'body'    => 'Seu PDF terminou de processar.',
        ], ['X-Internal-Key' => 'chave-errada']);
        $chaveErrada->assertStatus(401);

        $this->assertDatabaseMissing('notifications', ['user_id' => $user->id]);
    }

    public function test_internal_endpoint_validates_payload(): void
    {
        $response = $this->postJson('/api/internal/notifications', [
            'title' => 'Sem user_id nem type nem body',
        ], ['X-Internal-Key' => 'test-internal-key']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['user_id', 'type', 'body']);
    }
}
