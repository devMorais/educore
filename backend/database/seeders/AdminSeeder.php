<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Cria um usuário admin padrão se não existir nenhum admin (BS-006).
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('role', 'admin')->doesntExist()) {
            User::updateOrCreate(
                ['email' => 'admin@educore.test'],
                [
                    'name'              => 'Administrador EduCore',
                    'password'          => Hash::make('Admin@123!'),
                    'role'              => 'admin',
                    'email_verified_at' => now(),
                ]
            );

            $this->command->info('Admin padrão criado: admin@educore.test / Admin@123!');
        } else {
            $this->command->info('Já existe um admin — seeder ignorado.');
        }
    }
}
