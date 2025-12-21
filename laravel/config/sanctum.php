<?php

use Laravel\Sanctum\Sanctum;

return [
    'stateful' => [
        'localhost:3000',
        '127.0.0.1:3000',
    ],

    'guard' => ['web'],

    'expiration' => null,

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
