<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use App\Models\User;

class ReportController extends Controller
{
    private function getUserFromToken(?string $token)
    {
        if (!$token) return null;
        return User::where('api_token', $token)->first();
    }

    public function summary(Request $request)
    {
        // Ambil token dari query param (bukan Authorization header)
        $token = $request->query('token');
        $user = $this->getUserFromToken($token);

        // OWNER ONLY
        if (!$user || strtolower($user->role ?? '') !== 'owner') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $range = $request->query('range', 'month');
        $today = Carbon::today()->locale('id');

        if ($range === 'year') {
            $start = $today->copy()->startOfYear();
            $end   = $today->copy()->endOfYear();

            $rangeLabel  = 'Laporan Tahunan';
            $periodLabel = 'Tahun ' . $today->format('Y');
            $fileTitle   = 'Laporan Tahunan - Tahun ' . $today->format('Y');
        } else {
            $start = $today->copy()->startOfMonth();
            $end   = $today->copy()->endOfMonth();

            $rangeLabel  = 'Laporan Bulanan';
            $periodLabel = 'Bulan ' . $today->translatedFormat('F Y');
            $fileTitle   = 'Laporan Bulanan - Bulan ' . $today->translatedFormat('F Y');
        }

        $startDate = $start->toDateString();
        $endDate   = $end->toDateString();

        $invoices = Invoice::whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal')
            ->get();

        $expenses = Expense::whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal')
            ->get();

        $rows = [];
        $totalIncome = 0;
        $totalExpense = 0;

        /**
         * ✅ 1) Gabungkan invoice & expense dalam 1 array
         * Simpan "tanggal_sort" untuk sorting.
         */
        foreach ($invoices as $inv) {
            $income = (float) ($inv->total_bayar ?? 0);
            $totalIncome += $income;

            $rows[] = [
                'nomor'        => $inv->no_invoice ?? '-',
                'tanggal_sort' => Carbon::parse($inv->tanggal)->format('Y-m-d'), // ✅ untuk sorting
                'tanggal'      => Carbon::parse($inv->tanggal)->format('d-m-Y'),
                'income'       => $income,
                'expense'      => 0,
                'type'         => 'income',
            ];
        }

        foreach ($expenses as $exp) {
            $expense = (float) ($exp->total_pengeluaran ?? 0);
            $totalExpense += $expense;

            $rows[] = [
                'nomor'        => $exp->no_expense ?? '-',
                'tanggal_sort' => Carbon::parse($exp->tanggal)->format('Y-m-d'), // ✅ untuk sorting
                'tanggal'      => Carbon::parse($exp->tanggal)->format('d-m-Y'),
                'income'       => 0,
                'expense'      => $expense,
                'type'         => 'expense',
            ];
        }

        /**
         * ✅ 2) Sort by tanggal_sort (chronological)
         * Jika tanggal sama, urutkan berdasarkan nomor dokumen biar stabil.
         */
        usort($rows, function ($a, $b) {
            $cmp = strcmp($a['tanggal_sort'], $b['tanggal_sort']);
            if ($cmp !== 0) return $cmp;

            // tie breaker: nomor dokumen
            $cmpNomor = strcmp((string)$a['nomor'], (string)$b['nomor']);
            if ($cmpNomor !== 0) return $cmpNomor;

            // tie breaker terakhir: type
            return strcmp($a['type'], $b['type']);
        });

        /**
         * ✅ 3) Baru tambahkan nomor urut setelah sorting
         */
        $rows = array_values(array_map(function ($row, $idx) {
            return [
                'no'      => $idx + 1,
                'nomor'   => $row['nomor'],
                'tanggal' => $row['tanggal'],
                'income'  => $row['income'],
                'expense' => $row['expense'],
            ];
        }, $rows, array_keys($rows)));

        $net = $totalIncome - $totalExpense;

        $data = [
            'rangeLabel'   => $rangeLabel,
            'periodLabel'  => $periodLabel,
            'generatedAt'  => now()->format('d-m-Y H:i'),
            'ownerName'    => 'Bezalael Antok',
            'rows'         => $rows,
            'totalIncome'  => $totalIncome,
            'totalExpense' => $totalExpense,
            'net'          => $net,
        ];

        $pdf = Pdf::loadView('reports.summary', $data)
            ->setPaper('A4', 'landscape');

        return $pdf->stream($fileTitle . '.pdf');
    }
}
