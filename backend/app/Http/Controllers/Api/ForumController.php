<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumController extends Controller
{
    private const PER_PAGE = 10;

    /**
     * Colunas do autor expostas em tópicos/respostas — mesmo formato do
     * ForumAuthor no frontend (id, name, avatar, role), nunca email/senha.
     */
    private const AUTHOR_COLUMNS = 'id,name,avatar,role';

    public function topics(Request $request): JsonResponse
    {
        $query = ForumTopic::query()->with('user:' . self::AUTHOR_COLUMNS);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', self::PER_PAGE);
        $topics  = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($topics);
    }

    public function storeTopic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body'  => ['required', 'string'],
        ]);

        $topic = ForumTopic::create([
            'user_id'       => $request->user()->id,
            'title'         => $validated['title'],
            'body'          => $validated['body'],
            'replies_count' => 0,
        ]);

        $topic->load('user:' . self::AUTHOR_COLUMNS);

        return response()->json($topic, 201);
    }

    public function destroyTopic(Request $request, int $id): JsonResponse
    {
        $topic = ForumTopic::findOrFail($id);

        if (! $this->canModerate($request, $topic->user_id)) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $topic->delete();

        return response()->json(['message' => 'Tópico excluído.']);
    }

    public function replies(Request $request, int $topicId): JsonResponse
    {
        ForumTopic::findOrFail($topicId);

        $perPage  = (int) $request->input('per_page', self::PER_PAGE);
        $replies  = ForumReply::query()
            ->with('user:' . self::AUTHOR_COLUMNS)
            ->where('topic_id', $topicId)
            ->orderBy('created_at')
            ->paginate($perPage);

        return response()->json($replies);
    }

    public function storeReply(Request $request, int $topicId): JsonResponse
    {
        $topic = ForumTopic::findOrFail($topicId);

        $validated = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $reply = ForumReply::create([
            'topic_id' => $topic->id,
            'user_id'  => $request->user()->id,
            'body'     => $validated['body'],
        ]);

        $topic->increment('replies_count');
        $topic->update(['last_reply_at' => now()]);

        $reply->load('user:' . self::AUTHOR_COLUMNS);

        return response()->json($reply, 201);
    }

    public function destroyReply(Request $request, int $topicId, int $replyId): JsonResponse
    {
        $reply = ForumReply::where('topic_id', $topicId)->findOrFail($replyId);

        if (! $this->canModerate($request, $reply->user_id)) {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        $reply->delete();
        $reply->topic->decrement('replies_count');

        return response()->json(['message' => 'Resposta excluída.']);
    }

    /** Autor do recurso ou admin — mesma regra pra tópico e resposta. */
    private function canModerate(Request $request, int $resourceUserId): bool
    {
        $user = $request->user();

        return $user->id === $resourceUserId || $user->role === 'admin';
    }
}
