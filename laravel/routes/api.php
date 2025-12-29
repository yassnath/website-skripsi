<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArmadaController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;

/**
 * ✅ PUBLIC ROUTES (TANPA LOGIN)
 * Customer bisa akses langsung dari link email
 */
Route::get('/public/invoices/{id}', [InvoiceController::class, 'publicShow']);
Route::get('/public/invoices/{id}/pdf', [InvoiceController::class, 'publicPdf']);
Route::get('/public/invoices/{id}/pdf-link', [InvoiceController::class, 'publicPdfLink']);

/**
 * ✅ OPTIONAL: public pdf expense jika kamu mau (customer dapat akses expense pdf juga)
 */
Route::get('/public/expenses/{id}/pdf', [ExpenseController::class, 'publicPdf']);

/**
 * ✅ REPORT PUBLIC (tanpa login)
 */
Route::get('/reports/summary', [ReportController::class, 'summary']);

Route::post('/login', [AuthController::class, 'login']);


/**
 * ✅ PRIVATE ROUTES (HARUS LOGIN)
 */
Route::middleware('auth.api')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);

    // ARMADA
    Route::get('/armadas', [ArmadaController::class, 'index']);
    Route::post('/armadas', [ArmadaController::class, 'store']);
    Route::get('/armadas/{id}', [ArmadaController::class, 'show']);
    Route::put('/armadas/{id}', [ArmadaController::class, 'update']);
    Route::delete('/armadas/{id}', [ArmadaController::class, 'destroy']);

    // INVOICE CRUD
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
    Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);

    // EXPENSE CRUD
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);
});
