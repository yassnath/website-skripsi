<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

// IMPORTANT: kamu butuh model User sesuai projectmu
use App\Models\User;

class ReportController extends Controller
{
    private function getUserFromToken(?string $token)
    {
        if (!$token) return null;

        // Sesuaikan dengan sistem token kamu.
        // Umumnya token disimpan di kolom 'api_token' atau tabel token sendiri.
        // Karena di projectmu ada middleware auth.api custom, paling aman kita cari field api_token.
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
        $no = 1;
        $totalIncome = 0;
        $totalExpense = 0;

        foreach ($invoices as $inv) {
            $rows[] = [
                'no'      => $no++,
                'nomor'   => $inv->no_invoice ?? '-',
                'tanggal' => Carbon::parse($inv->tanggal)->format('d-m-Y'),
                'income'  => (float) ($inv->total_bayar ?? 0),
                'expense' => 0,
            ];
            $totalIncome += (float) ($inv->total_bayar ?? 0);
        }

        foreach ($expenses as $exp) {
            $rows[] = [
                'no'      => $no++,
                'nomor'   => $exp->no_expense ?? '-',
                'tanggal' => Carbon::parse($exp->tanggal)->format('d-m-Y'),
                'income'  => 0,
                'expense' => (float) ($exp->total_pengeluaran ?? 0),
            ];
            $totalExpense += (float) ($exp->total_pengeluaran ?? 0);
        }

        usort($rows, fn($a, $b) => $a['no'] <=> $b['no']);

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
