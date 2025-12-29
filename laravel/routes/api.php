<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArmadaController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (NO AUTH)
|--------------------------------------------------------------------------
| Pastikan ini benar-benar tidak kena middleware auth/api kamu.
| Kita pakai ->withoutMiddleware() biar 100% public.
*/
Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'pdf'])
    ->whereNumber('id')
    ->withoutMiddleware(['auth.api']);

Route::get('/expenses/{id}/pdf', [ExpenseController::class, 'pdf'])
    ->whereNumber('id')
    ->withoutMiddleware(['auth.api']);

Route::get('/invoices/{id}/pdf-link', [InvoiceController::class, 'pdfLink'])
    ->whereNumber('id')
    ->withoutMiddleware(['auth.api']);

// report public
Route::get('/reports/summary', [ReportController::class, 'summary'])
    ->withoutMiddleware(['auth.api']);

Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/
Route::middleware('auth.api')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);

    // ARMADA
    Route::get('/armadas', [ArmadaController::class, 'index']);
    Route::post('/armadas', [ArmadaController::class, 'store']);
    Route::get('/armadas/{id}', [ArmadaController::class, 'show'])->whereNumber('id');
    Route::put('/armadas/{id}', [ArmadaController::class, 'update'])->whereNumber('id');
    Route::delete('/armadas/{id}', [ArmadaController::class, 'destroy'])->whereNumber('id');

    // INVOICE CRUD
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->whereNumber('id');
    Route::put('/invoices/{id}', [InvoiceController::class, 'update'])->whereNumber('id');
    Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy'])->whereNumber('id');

    // EXPENSE CRUD
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/{id}', [ExpenseController::class, 'show'])->whereNumber('id');
    Route::put('/expenses/{id}', [ExpenseController::class, 'update'])->whereNumber('id');
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy'])->whereNumber('id');
});
