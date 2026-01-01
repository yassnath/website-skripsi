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
        $msgGeneral = "Data is still incomplete, please complete it first!";

        $validated = $request->validate([
            'no_invoice' => 'required|string|unique:invoices,no_invoice',
            'nama_pelanggan' => 'required|string',
            'email' => 'nullable|string',
            'no_telp' => 'nullable|string',
            'tanggal' => 'required|date',
            'due_date' => 'nullable|date',

            'total_biaya' => 'nullable|numeric',
            'pph' => 'nullable|numeric',
            'total_bayar' => 'nullable|numeric',

            'status' => 'required|string',
            'diterima_oleh' => 'nullable|string',

            // ✅ rincian WAJIB ada & minimal 1
            'rincian' => 'required|array|min:1',

            // ✅ wajib lengkap per rincian
            'rincian.*.lokasi_muat' => 'required|string',
            'rincian.*.lokasi_bongkar' => 'required|string',
            'rincian.*.armada_id' => 'required|exists:armadas,id',
            'rincian.*.armada_start_date' => 'required|date',
            'rincian.*.armada_end_date' => 'required|date',
            'rincian.*.tonase' => 'required|numeric|min:1',
            'rincian.*.harga' => 'required|numeric|min:1',
        ], [
            // ✅ override message agar selalu sesuai request kamu
            'required' => $msgGeneral,
            'rincian.required' => $msgGeneral,
            'rincian.array' => $msgGeneral,
            'rincian.min' => $msgGeneral,
        ]);

        // ✅ inject rincian pertama ke top-level field agar tetap kompatibel
        $first = $validated['rincian'][0];

        $payload = [
            'no_invoice' => $validated['no_invoice'],
            'nama_pelanggan' => $validated['nama_pelanggan'],
            'email' => $validated['email'] ?? null,
            'no_telp' => $validated['no_telp'] ?? null,
            'tanggal' => $validated['tanggal'],
            'due_date' => $validated['due_date'] ?? null,

            'armada_id' => $first['armada_id'],
            'armada_start_date' => $first['armada_start_date'],
            'armada_end_date' => $first['armada_end_date'],
            'lokasi_muat' => $first['lokasi_muat'],
            'lokasi_bongkar' => $first['lokasi_bongkar'],
            'tonase' => $first['tonase'],
            'harga' => $first['harga'],

            'total_biaya' => $validated['total_biaya'] ?? 0,
            'pph' => $validated['pph'] ?? 0,
            'total_bayar' => $validated['total_bayar'] ?? 0,

            'status' => $validated['status'],
            'diterima_oleh' => $validated['diterima_oleh'] ?? null,

            // ✅ simpan JSON rincian
            'rincian' => json_encode($validated['rincian']),
        ];

        $invoice = Invoice::create($payload);

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

        $msgGeneral = "Data is still incomplete, please complete it first!";

        $validated = $request->validate([
            'no_invoice' => 'required|string|unique:invoices,no_invoice,' . $invoice->id,
            'nama_pelanggan' => 'required|string',
            'email' => 'nullable|string',
            'no_telp' => 'nullable|string',
            'tanggal' => 'required|date',
            'due_date' => 'nullable|date',

            'total_biaya' => 'nullable|numeric',
            'pph' => 'nullable|numeric',
            'total_bayar' => 'nullable|numeric',

            'status' => 'required|string',
            'diterima_oleh' => 'nullable|string',

            // ✅ rincian WAJIB ada & minimal 1
            'rincian' => 'required|array|min:1',

            // ✅ wajib lengkap per rincian
            'rincian.*.lokasi_muat' => 'required|string',
            'rincian.*.lokasi_bongkar' => 'required|string',
            'rincian.*.armada_id' => 'required|exists:armadas,id',
            'rincian.*.armada_start_date' => 'required|date',
            'rincian.*.armada_end_date' => 'required|date',
            'rincian.*.tonase' => 'required|numeric|min:1',
            'rincian.*.harga' => 'required|numeric|min:1',
        ], [
            'required' => $msgGeneral,
            'rincian.required' => $msgGeneral,
            'rincian.array' => $msgGeneral,
            'rincian.min' => $msgGeneral,
        ]);

        $first = $validated['rincian'][0];

        $payload = [
            'no_invoice' => $validated['no_invoice'],
            'nama_pelanggan' => $validated['nama_pelanggan'],
            'email' => $validated['email'] ?? null,
            'no_telp' => $validated['no_telp'] ?? null,
            'tanggal' => $validated['tanggal'],
            'due_date' => $validated['due_date'] ?? null,

            // ✅ update top-level sesuai rincian pertama (kompatibel)
            'armada_id' => $first['armada_id'],
            'armada_start_date' => $first['armada_start_date'],
            'armada_end_date' => $first['armada_end_date'],
            'lokasi_muat' => $first['lokasi_muat'],
            'lokasi_bongkar' => $first['lokasi_bongkar'],
            'tonase' => $first['tonase'],
            'harga' => $first['harga'],

            'total_biaya' => $validated['total_biaya'] ?? 0,
            'pph' => $validated['pph'] ?? 0,
            'total_bayar' => $validated['total_bayar'] ?? 0,

            'status' => $validated['status'],
            'diterima_oleh' => $validated['diterima_oleh'] ?? null,

            // ✅ simpan rincian JSON
            'rincian' => json_encode($validated['rincian']),
        ];

        $invoice->update($payload);

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

            if (!view()->exists('invoices.invoice')) {
                return response()->json([
                    'message' => 'Template PDF tidak ditemukan: resources/views/invoices/invoice.blade.php'
                ], 500);
            }

            @mkdir(storage_path('app/dompdf'), 0777, true);
            @mkdir(storage_path('app/dompdf/fonts'), 0777, true);

            $pdf = Pdf::loadView('invoices.invoice', [
                'invoice' => $invoice,
            ]);

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
     */
    public function publicPdfLink($id)
    {
        $invoice = Invoice::findOrFail($id);

        $base = rtrim(config('app.url'), '/');

        return response()->json([
            'url' => "{$base}/api/public/invoices/{$invoice->id}/pdf"
        ]);
    }
}
