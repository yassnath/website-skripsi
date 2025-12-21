<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ExpenseController extends Controller
{
    public function index()
    {
        return Expense::orderBy('tanggal', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'no_expense'        => 'required|string|unique:expenses,no_expense',
            'tanggal'           => 'required|date',
            'kategori'          => 'nullable|string',
            'keterangan'        => 'nullable|string',
            'total_pengeluaran' => 'required|numeric',
            'status'            => 'nullable|string',
            'rincian'           => 'nullable|array',
        ]);

        $user = $request->user();
        $validated['dicatat_oleh'] = $request->dicatat_oleh ?: ($user?->username ?? 'unknown');
        $validated['rincian'] = json_encode($request->rincian ?? []);

        $expense = Expense::create($validated);

        return response()->json([
            "id" => $expense->id,
            "no_expense" => $expense->no_expense,
            "tanggal" => $expense->tanggal,
            "total_pengeluaran" => $expense->total_pengeluaran,
            "status" => $expense->status,
            "dicatat_oleh" => $expense->dicatat_oleh,
            "rincian" => json_decode($expense->rincian ?? "[]")
        ], 201);
    }

    public function show($id)
    {
        $data = Expense::find($id);

        if (!$data) {
            return response()->json(["message" => "Not found"], 404);
        }

        $data->rincian = json_decode($data->rincian ?? "[]");

        return $data;
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(["message" => "Not found"], 404);
        }

        $validated = $request->validate([
            'tanggal'           => 'nullable|date',
            'kategori'          => 'nullable|string',
            'keterangan'        => 'nullable|string',
            'total_pengeluaran' => 'nullable|numeric',
            'status'            => 'nullable|string',
            'rincian'           => 'nullable|array',
        ]);

        $validated['rincian'] = json_encode($request->rincian ?? []);
        $validated['dicatat_oleh'] = $request->dicatat_oleh ?: $expense->dicatat_oleh;

        $expense->update($validated);

        $expense = $expense->fresh();
        $expense->rincian = json_decode($expense->rincian ?? "[]");

        return response()->json($expense);
    }

    public function destroy($id)
    {
        $expense = Expense::find($id);

        if (!$expense) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $expense->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function pdf($id)
    {
        $expense = Expense::findOrFail($id);

        $expense->details = json_decode($expense->rincian ?? "[]");

        $pdf = Pdf::loadView('expenses.expense', [
            'expense' => $expense
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('expense-'.$expense->no_expense.'.pdf');
    }
}
