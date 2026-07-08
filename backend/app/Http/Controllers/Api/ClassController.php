<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EduClass;
use App\Support\XDebug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClassController extends Controller
{
    /**
     * Lista as turmas do professor autenticado (D-01).
     * Cada professor só vê as próprias turmas.
     */
    public function index(Request $request): JsonResponse
    {
        $turmas = EduClass::where('professor_id', $request->user()->id)
            ->withCount('students')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($turmas);
    }

    /**
     * Lista todas as turmas de todos os professores (D-01).
     * Rota admin-only, protegida por middleware role:admin.
     */
    public function adminIndex(): JsonResponse
    {
        $turmas = EduClass::with('professor:id,name,email')
            ->withCount('students')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($turmas);
    }

    /**
     * Cria uma nova turma para o professor autenticado (D-01).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ])->validate();

        $turma = EduClass::create([
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'professor_id' => $request->user()->id,
        ]);

        $turma->loadCount('students');

        return response()->json($turma, 201);
    }

    /**
     * Mostra uma turma específica com os alunos matriculados (D-01).
     * Só o professor dono da turma (ou admin) pode visualizar.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $turma = EduClass::with('students:id,name,email,avatar')
            ->withCount('students')
            ->findOrFail($id);

        $this->autorizarAcessoOuFalhar($request, $turma);

        return response()->json($turma);
    }

    /**
     * Atualiza os dados de uma turma (D-01).
     * Só o professor dono da turma (ou admin) pode editar.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $turma = EduClass::findOrFail($id);
        $this->autorizarAcessoOuFalhar($request, $turma);

        $validated = Validator::make($request->all(), [
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ])->validate();

        $turma->update($validated);
        $turma->loadCount('students');

        return response()->json($turma);
    }

    /**
     * Remove (soft delete) uma turma (D-01).
     * Só o professor dono da turma (ou admin) pode remover.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $turma = EduClass::findOrFail($id);
        $this->autorizarAcessoOuFalhar($request, $turma);

        $turma->delete();

        return response()->json(['message' => 'Turma removida com sucesso.']);
    }

    /**
     * Lista os alunos matriculados numa turma, paginado (D-01).
     * Só o professor dono da turma (ou admin) pode visualizar.
     */
    public function students(Request $request, int $classId): JsonResponse
    {
        $turma = EduClass::findOrFail($classId);
        $this->autorizarAcessoOuFalhar($request, $turma);

        $alunos = $turma->students()
            ->orderBy('name')
            ->paginate(20);

        return response()->json($alunos);
    }

    /**
     * Matricula um aluno na turma (D-01).
     * Só o professor dono da turma (ou admin) pode matricular.
     */
    public function enroll(Request $request, int $classId): JsonResponse
    {
        $turma = EduClass::findOrFail($classId);
        $this->autorizarAcessoOuFalhar($request, $turma);

        $validated = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ])->validate();

        // syncWithoutDetaching evita duplicar a matrícula se o aluno já estiver na turma
        $turma->students()->syncWithoutDetaching([$validated['user_id']]);

        return response()->json(['message' => 'Aluno matriculado com sucesso.']);
    }

    /**
     * Remove a matrícula de um aluno na turma (D-01).
     * Só o professor dono da turma (ou admin) pode remover a matrícula.
     */
    public function unenroll(Request $request, int $classId, int $userId): JsonResponse
    {
        $turma = EduClass::findOrFail($classId);
        $this->autorizarAcessoOuFalhar($request, $turma);

        $turma->students()->detach($userId);

        return response()->json(['message' => 'Matrícula removida com sucesso.']);
    }

    /**
     * Garante que o usuário autenticado é o professor dono da turma ou um admin.
     * Impede que um professor acesse/edite/matricule em turma de outro professor.
     */
    private function autorizarAcessoOuFalhar(Request $request, EduClass $turma): void
    {
        $user = $request->user();

        if ($turma->professor_id !== $user->id && $user->role !== 'admin') {
            abort(403, 'Você não tem permissão para acessar esta turma.');
        }
    }
}
