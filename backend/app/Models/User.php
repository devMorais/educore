<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// BS-023: implements MustVerifyEmail habilita o fluxo de verificação de email.
// Os métodos (hasVerifiedEmail/markEmailAsVerified/sendEmailVerificationNotification)
// já vêm do trait MustVerifyEmail, incluído na base Authenticatable.
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'email_verified_at',
        'role',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // BS-023: expõe `email_verified` (bool) em toda serialização do usuário
    // (login, register, /me…) para o front exibir o banner de aviso.
    protected $appends = ['email_verified'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /** BS-023: flag booleana de verificação de email (derivada de email_verified_at). */
    public function getEmailVerifiedAttribute(): bool
    {
        return ! is_null($this->email_verified_at);
    }
}
