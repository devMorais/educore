<?php

namespace Database\Factories;

use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ForumReply>
 */
class ForumReplyFactory extends Factory
{
    protected $model = ForumReply::class;

    public function definition(): array
    {
        return [
            'topic_id' => ForumTopic::factory(),
            'user_id'  => User::factory(),
            'body'     => fake()->paragraph(),
        ];
    }
}
