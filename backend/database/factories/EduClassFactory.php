<?php

namespace Database\Factories;

use App\Models\EduClass;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EduClass>
 */
class EduClassFactory extends Factory
{
    protected $model = EduClass::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'         => fake()->words(3, true),
            'description'  => fake()->sentence(),
            'professor_id' => User::factory()->state(['role' => 'professor']),
        ];
    }
}