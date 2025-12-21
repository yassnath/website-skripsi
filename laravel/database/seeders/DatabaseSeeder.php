<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // OWNER
        User::updateOrCreate(
            ['username' => 'owner'],
            [
                'role'      => 'owner',
                'password'  => Hash::make('ownercvant'),
                'api_token' => Str::random(60),
            ]
        );

        // ADMIN
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'role'      => 'admin',
                'password'  => Hash::make('admincvant'),
                'api_token' => Str::random(60),
            ]
        );
    }
}
