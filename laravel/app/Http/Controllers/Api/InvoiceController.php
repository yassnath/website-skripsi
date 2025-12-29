<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * ✅ PRIVATE: List invoice (butuh login)
     */
    public function index()
    {
        return Invoice::with('armada')->latest()->get();
    }

    /**
     * ✅ PRIVATE: Store invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'no_invoice' => 'required|string|unique:invoices,no_invoice',
            'nama_pelanggan' => 'required|string',
            'email' => 'nullable|string',
            'no_telp' => 'nullable|string',
            'tanggal' => 'required|date',
            'due_date' => 'nullable|date',
            'armada_id' => 'nullable|exists:armadas,id',
            'armada_start_date' => 'nullable|date',
            'armada_end_date' => 'nullable|date',
            'lokasi_muat' => 'nullable|string',
            'lokasi_bongkar' => 'nullable|string',
            'tonase' => 'nullable|numeric',
            'harga' => 'nullable|numeric',
            'total_biaya' => 'nullable|numeric',
            'pph' => 'nullable|numeric',
            'total_bayar' => 'nullable|numeric',
            'status' => 'nullable|string',
            'diterima_oleh' => 'nullable|string',
            'rincian' => 'nullable',
        ]);

        $invoice = Invoice::create($validated);
        return $invoice->load('armada');
    }

    /**
     * ✅ PRIVATE: Show invoice by id (butuh login)
     */
    public function show($id)
    {
        $invoice = Invoice::with('armada')->findOrFail($id);

        // ✅ pastikan rincian selalu array
        if (!is_array($invoice->rincian)) {
            $invoice->rincian = $invoice->rincian ? json_decode($invoice->rincian, true) : [];
        }

        return $invoice;
    }

    /**
     * ✅ PRIVATE: Update invoice
     */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'no_invoice' => 'required|string|unique:invoices,no_invoice,' . $invoice->id,
            'nama_pelanggan' => 'required|string',
            'email' => 'nullable|string',
            'no_telp' => 'nullable|string',
            'tanggal' => 'required|date',
            'due_date' => 'nullable|date',
            'armada_id' => 'nullable|exists:armadas,id',
            'armada_start_date' => 'nullable|date',
            'armada_end_date' => 'nullable|date',
            'lokasi_muat' => 'nullable|string',
            'lokasi_bongkar' => 'nullable|string',
            'tonase' => 'nullable|numeric',
            'harga' => 'nullable|numeric',
            'total_biaya' => 'nullable|numeric',
            'pph' => 'nullable|numeric',
            'total_bayar' => 'nullable|numeric',
            'status' => 'nullable|string',
            'diterima_oleh' => 'nullable|string',
            'rincian' => 'nullable',
        ]);

        $invoice->update($validated);
        return $invoice->load('armada');
    }

    /**
     * ✅ PRIVATE: Delete invoice
     */
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted']);
    }

    /**
     * ✅ PRIVATE PDF (untuk internal dashboard)
     * URL: /api/invoices/{id}/pdf (butuh login)
     */
    public function pdf($id)
    {
        $invoice = Invoice::with('armada')->findOrFail($id);

        if (!is_array($invoice->rincian)) {
            $invoice->rincian = $invoice->rincian ? json_decode($invoice->rincian, true) : [];
        }

        // ✅ view yang benar adalah: resources/views/invoices/invoice.blade.php
        if (!view()->exists('invoices.invoice')) {
            return response()->json([
                'message' => 'Template PDF tidak ditemukan: resources/views/invoices/invoice.blade.php'
            ], 500);
        }

        $pdf = Pdf::loadView('invoices.invoice', [
            'invoice' => $invoice
        ]);

        return $pdf->stream("invoice-{$invoice->no_invoice}.pdf");
    }

    /**
     * ✅ ✅ ✅ PUBLIC SHOW (TANPA LOGIN)
     * URL: /api/public/invoices/{id}
     */
    public function publicShow($id)
    {
        $invoice = Invoice::with('armada')->find($id);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice tidak ditemukan'], 404);
        }

        $rin = $invoice->rincian;

        if (!is_array($rin)) {
            $rin = $rin ? json_decode($rin, true) : [];
            if (!is_array($rin)) $rin = [];
        }

        // ✅ inject armada_plat untuk public preview
        if (is_array($rin) && count($rin) > 0) {
            foreach ($rin as $idx => $r) {
                if (!is_array($r)) continue;

                $hasPlat = isset($r['armada_plat']) && trim((string)$r['armada_plat']) !== '';
                $hasNestedArmadaPlat = isset($r['armada']['plat_nomor']) && trim((string)$r['armada']['plat_nomor']) !== '';

                if (!$hasPlat && !$hasNestedArmadaPlat && isset($r['armada_id'])) {
                    $armada = \App\Models\Armada::find($r['armada_id']);
                    $r['armada_plat'] = $armada ? $armada->plat_nomor : '-';
                }

                $rin[$idx] = $r;
            }
        }

        $invoice->rincian = $rin;

        return response()->json($invoice);
    }

    /**
     * ✅ ✅ ✅ PUBLIC PDF (TANPA LOGIN)
     * URL: /api/public/invoices/{id}/pdf
     */
    public function publicPdf($id)
    {
        try {
            $invoice = Invoice::with('armada')->find($id);

            if (!$invoice) {
                return response()->json(['message' => 'Invoice tidak ditemukan'], 404);
            }

            $rin = $invoice->rincian;

            if (!is_array($rin)) {
                $rin = $rin ? json_decode($rin, true) : [];
                if (!is_array($rin)) $rin = [];
            }

            $invoice->rincian = $rin;

            // ✅ view yang benar adalah: resources/views/invoices/invoice.blade.php
            if (!view()->exists('invoices.invoice')) {
                return response()->json([
                    'message' => 'Template PDF tidak ditemukan: resources/views/invoices/invoice.blade.php'
                ], 500);
            }

            // ✅ Pastikan folder exist & writable (Railway)
            @mkdir(storage_path('app/dompdf'), 0777, true);
            @mkdir(storage_path('app/dompdf/fonts'), 0777, true);

            $pdf = Pdf::loadView('invoices.invoice', [
                'invoice' => $invoice,
            ]);

            // ✅ KUNCI STABIL DI RAILWAY:
            $pdf->setOption('isRemoteEnabled', true);
            $pdf->setOption('tempDir', sys_get_temp_dir());
            $pdf->setOption('fontDir', storage_path('app/dompdf/fonts'));
            $pdf->setOption('fontCache', storage_path('app/dompdf/fonts'));
            $pdf->setPaper('a4', 'landscape');

            return $pdf->stream("invoice-{$invoice->no_invoice}.pdf");
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal generate PDF',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * ✅ ✅ ✅ PUBLIC PDF LINK (TANPA LOGIN)
     * URL: /api/public/invoices/{id}/pdf-link
     * Ini opsional (front-end kamu sebenarnya sudah bisa build link sendiri)
     */
    public function publicPdfLink($id)
    {
        $invoice = Invoice::findOrFail($id);

        // ✅ base domain publik (APP_URL)
        $base = rtrim(config('app.url'), '/');

        return response()->json([
            'url' => "{$base}/api/public/invoices/{$invoice->id}/pdf"
        ]);
    }
}
