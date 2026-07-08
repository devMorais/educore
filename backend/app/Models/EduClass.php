<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Turma (D-01). Nomeado "EduClass" porque "Class" é palavra reservada no PHP.
 */
class EduClass extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'name',
        'description',
        'professor_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Professor dono da turma.
     */
    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    /**
     * Alunos matriculados na turma (via tabela pivot class_user).
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_user', 'class_id', 'user_id')
            ->withTimestamps();
    }
}