<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ✅ Railway behind proxy -> pastikan URL dibuat https saat production
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
