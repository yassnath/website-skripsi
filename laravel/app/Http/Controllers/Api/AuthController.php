<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        // Cari user berdasarkan username
        $user = User::where('username', $request->username)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Username atau password tidak sesuai.'
            ], 401);
        }

        // Cek password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Username atau password tidak sesuai.'
            ], 401);
        }

        // Generate token baru
        $token = Str::random(60);
        $user->api_token = $token;
        $user->save();

        return response()->json([
            'token' => $token,
            'user' => [
                'id'       => $user->id,
                'username' => $user->username,
                'role'     => $user->role,
            ],
        ]);
    }
}
