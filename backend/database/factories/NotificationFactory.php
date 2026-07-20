<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type'    => 'document_completed',
            'title'   => fake()->sentence(3),
            'body'    => fake()->sentence(10),
            'data'    => null,
            'read_at' => null,
        ];
    }
}
