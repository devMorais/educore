<?php

namespace Tests\Feature;

use App\Models\EduClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassesTest extends TestCase
{
    use RefreshDatabase;

    public function test_professor_can_create_class(): void
    {
        $professor = User::factory()->create(['role' => 'professor']);

        $response = $this->actingAs($professor, 'sanctum')
            ->postJson('/api/classes', [
                'name'        => 'Turma de Matemática',
                'description' => 'Turma do 9º ano',
            ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Turma de Matemática']);

        $this->assertDatabaseHas('classes', [
            'name'         => 'Turma de Matemática',
            'professor_id' => $professor->id,
        ]);
    }

    public function test_professor_can_enroll_student_in_own_class(): void
    {
        $professor = User::factory()->create(['role' => 'professor']);
        $student   = User::factory()->create(['role' => 'student']);
        $turma     = EduClass::factory()->create(['professor_id' => $professor->id]);

        $response = $this->actingAs($professor, 'sanctum')
            ->postJson("/api/classes/{$turma->id}/enroll", [
                'user_id' => $student->id,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('class_user', [
            'class_id' => $turma->id,
            'user_id'  => $student->id,
        ]);
    }

    public function test_professor_cannot_access_another_professors_class(): void
    {
        $professorA = User::factory()->create(['role' => 'professor']);
        $professorB = User::factory()->create(['role' => 'professor']);
        $turmaDoB   = EduClass::factory()->create(['professor_id' => $professorB->id]);

        // Professor A tenta ver a turma do Professor B
        $response = $this->actingAs($professorA, 'sanctum')
            ->getJson("/api/classes/{$turmaDoB->id}");

        $response->assertStatus(403);
    }

    public function test_professor_cannot_enroll_student_in_another_professors_class(): void
    {
        $professorA = User::factory()->create(['role' => 'professor']);
        $professorB = User::factory()->create(['role' => 'professor']);
        $student    = User::factory()->create(['role' => 'student']);
        $turmaDoB   = EduClass::factory()->create(['professor_id' => $professorB->id]);

        $response = $this->actingAs($professorA, 'sanctum')
            ->postJson("/api/classes/{$turmaDoB->id}/enroll", [
                'user_id' => $student->id,
            ]);

        $response->assertStatus(403);

        $this->assertDatabaseMissing('class_user', [
            'class_id' => $turmaDoB->id,
            'user_id'  => $student->id,
        ]);
    }

    public function test_professor_only_sees_own_classes_in_index(): void
    {
        $professorA = User::factory()->create(['role' => 'professor']);
        $professorB = User::factory()->create(['role' => 'professor']);

        EduClass::factory()->create(['professor_id' => $professorA->id, 'name' => 'Turma do A']);
        EduClass::factory()->create(['professor_id' => $professorB->id, 'name' => 'Turma do B']);

        $response = $this->actingAs($professorA, 'sanctum')
            ->getJson('/api/classes');

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Turma do A'])
                 ->assertJsonMissing(['name' => 'Turma do B']);
    }

    public function test_admin_sees_all_classes(): void
    {
        $admin      = User::factory()->create(['role' => 'admin']);
        $professorA = User::factory()->create(['role' => 'professor']);
        $professorB = User::factory()->create(['role' => 'professor']);

        EduClass::factory()->create(['professor_id' => $professorA->id, 'name' => 'Turma do A']);
        EduClass::factory()->create(['professor_id' => $professorB->id, 'name' => 'Turma do B']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/classes');

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Turma do A'])
                 ->assertJsonFragment(['name' => 'Turma do B']);
    }

    public function test_unauthenticated_user_cannot_access_classes(): void
    {
        $response = $this->getJson('/api/classes');

        $response->assertStatus(401);
    }

    public function test_student_cannot_access_classes_routes(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/classes');

        $response->assertStatus(403);
    }
}