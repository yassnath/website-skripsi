<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Bebaskan login
        if ($request->is('api/login')) {
            return $next($request);
        }

        // Ambil token dari header Authorization: Bearer <token>
        $token = $request->bearerToken();

        // (Opsional) fallback token dari query param, biar konsisten dengan fitur report kamu
        if (!$token) {
            $token = $request->query('token');
        }

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = User::where('api_token', $token)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid token.'], 401);
        }

        auth()->setUser($user);

        return $next($request);
    }
}
