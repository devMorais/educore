<?php

namespace Database\Factories;

use App\Models\ForumTopic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ForumTopic>
 */
class ForumTopicFactory extends Factory
{
    protected $model = ForumTopic::class;

    public function definition(): array
    {
        return [
            'user_id'       => User::factory(),
            'title'         => fake()->sentence(6),
            'body'          => fake()->paragraph(),
            'replies_count' => 0,
            'last_reply_at' => null,
        ];
    }
}
