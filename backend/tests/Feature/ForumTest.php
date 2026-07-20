<?php

namespace Tests\Feature;

use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_topic(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/forum/topics', [
            'title' => 'Dúvida sobre RAG',
            'body'  => 'Como funciona o pipeline de embeddings?',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('title', 'Dúvida sobre RAG')
                 ->assertJsonPath('user.id', $user->id)
                 ->assertJsonPath('replies_count', 0);

        $this->assertDatabaseHas('forum_topics', [
            'user_id' => $user->id,
            'title'   => 'Dúvida sobre RAG',
        ]);
    }

    public function test_topic_creation_requires_title_and_body(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/forum/topics', [
            'title' => '',
            'body'  => '',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['title', 'body']);
    }

    public function test_authenticated_user_can_reply_and_topic_metadata_updates(): void
    {
        $user  = User::factory()->create();
        $topic = ForumTopic::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson("/api/forum/topics/{$topic->id}/replies", [
                             'body' => 'Aqui está a resposta.',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('body', 'Aqui está a resposta.')
                 ->assertJsonPath('user.id', $user->id);

        $topic->refresh();
        $this->assertSame(1, $topic->replies_count);
        $this->assertNotNull($topic->last_reply_at);
    }

    public function test_topic_listing_is_paginated_with_replies_count_and_author(): void
    {
        $author = User::factory()->create();
        ForumTopic::factory()->count(15)->create(['user_id' => $author->id]);

        $response = $this->actingAs($author, 'sanctum')->getJson('/api/forum/topics?per_page=10');

        $response->assertStatus(200)
                 ->assertJsonCount(10, 'data')
                 ->assertJsonPath('total', 15)
                 ->assertJsonPath('data.0.user.id', $author->id)
                 ->assertJsonStructure(['data' => [['id', 'title', 'body', 'replies_count', 'last_reply_at', 'user']]]);
    }

    public function test_topic_search_filters_by_title_or_body(): void
    {
        $user = User::factory()->create();
        ForumTopic::factory()->create(['title' => 'Dúvida sobre embeddings', 'body' => 'texto qualquer']);
        ForumTopic::factory()->create(['title' => 'Outro assunto', 'body' => 'nada a ver']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/forum/topics?search=embeddings');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_reply_listing_is_paginated(): void
    {
        $user  = User::factory()->create();
        $topic = ForumTopic::factory()->create();
        ForumReply::factory()->count(12)->create(['topic_id' => $topic->id]);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson("/api/forum/topics/{$topic->id}/replies?per_page=10");

        $response->assertStatus(200)
                 ->assertJsonCount(10, 'data')
                 ->assertJsonPath('total', 12);
    }

    public function test_author_can_delete_own_topic(): void
    {
        $user  = User::factory()->create();
        $topic = ForumTopic::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/forum/topics/{$topic->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('forum_topics', ['id' => $topic->id]);
    }

    public function test_other_user_cannot_delete_topic(): void
    {
        $owner    = User::factory()->create();
        $outsider = User::factory()->create(['role' => 'student']);
        $topic    = ForumTopic::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($outsider, 'sanctum')->deleteJson("/api/forum/topics/{$topic->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('forum_topics', ['id' => $topic->id, 'deleted_at' => null]);
    }

    public function test_admin_can_delete_any_topic(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $topic = ForumTopic::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/forum/topics/{$topic->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('forum_topics', ['id' => $topic->id]);
    }

    public function test_author_can_delete_own_reply_and_replies_count_decrements(): void
    {
        $user  = User::factory()->create();
        $topic = ForumTopic::factory()->create(['replies_count' => 1]);
        $reply = ForumReply::factory()->create(['topic_id' => $topic->id, 'user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')
                         ->deleteJson("/api/forum/topics/{$topic->id}/replies/{$reply->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('forum_replies', ['id' => $reply->id]);
        $this->assertSame(0, $topic->fresh()->replies_count);
    }

    public function test_other_user_cannot_delete_reply(): void
    {
        $owner    = User::factory()->create();
        $outsider = User::factory()->create(['role' => 'student']);
        $topic    = ForumTopic::factory()->create();
        $reply    = ForumReply::factory()->create(['topic_id' => $topic->id, 'user_id' => $owner->id]);

        $response = $this->actingAs($outsider, 'sanctum')
                         ->deleteJson("/api/forum/topics/{$topic->id}/replies/{$reply->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('forum_replies', ['id' => $reply->id, 'deleted_at' => null]);
    }

    public function test_forum_requires_authentication(): void
    {
        $this->getJson('/api/forum/topics')->assertStatus(401);
        $this->postJson('/api/forum/topics', ['title' => 'x', 'body' => 'y'])->assertStatus(401);
    }
}
