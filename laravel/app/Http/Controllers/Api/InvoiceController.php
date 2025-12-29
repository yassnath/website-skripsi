<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function index()
    {
        return Invoice::with('armada')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'no_invoice'         => 'required|unique:invoices,no_invoice',
            'nama_pelanggan'     => 'required',
            'email'              => 'nullable|email',
            'no_telp'            => 'nullable',
            'tanggal'            => 'required|date',
            'due_date'           => 'nullable|date',

            'armada_id'          => 'nullable|exists:armadas,id',
            'armada_start_date'  => 'nullable|date',
            'armada_end_date'    => 'nullable|date',
            'lokasi_muat'        => 'nullable',
            'lokasi_bongkar'     => 'nullable',
            'tonase'             => 'numeric',
            'harga'              => 'numeric',

            'total_biaya'        => 'numeric',
            'pph'                => 'numeric',
            'total_bayar'        => 'numeric',
            'status'             => 'required',
            'diterima_oleh'      => 'nullable',

            'rincian'                        => 'nullable|array',
            'rincian.*.lokasi_muat'          => 'nullable|string',
            'rincian.*.lokasi_bongkar'       => 'nullable|string',
            'rincian.*.armada_id'            => 'nullable|integer|exists:armadas,id',
            'rincian.*.armada_start_date'    => 'nullable|date',
            'rincian.*.armada_end_date'      => 'nullable|date',
            'rincian.*.tonase'               => 'nullable|numeric',
            'rincian.*.harga'                => 'nullable|numeric',
            'rincian.*.total'                => 'nullable|numeric',
        ]);

        $rincian = $request->input('rincian', null);

        if (is_array($rincian) && count($rincian) > 0) {
            $subtotal = 0;

            foreach ($rincian as $r) {
                $tonase = (float) ($r['tonase'] ?? 0);
                $harga  = (float) ($r['harga'] ?? 0);
                $subtotal += ($tonase * $harga);
            }

            $pph = $subtotal * 0.02;
            $totalBayar = $subtotal - $pph;

            $data['total_biaya'] = $subtotal;
            $data['pph'] = $pph;
            $data['total_bayar'] = $totalBayar;

            $first = $rincian[0];

            $data['lokasi_muat'] = $data['lokasi_muat'] ?? ($first['lokasi_muat'] ?? null);
            $data['lokasi_bongkar'] = $data['lokasi_bongkar'] ?? ($first['lokasi_bongkar'] ?? null);
            $data['armada_id'] = $data['armada_id'] ?? ($first['armada_id'] ?? null);
            $data['armada_start_date'] = $data['armada_start_date'] ?? ($first['armada_start_date'] ?? null);
            $data['armada_end_date'] = $data['armada_end_date'] ?? ($first['armada_end_date'] ?? null);
            $data['tonase'] = $data['tonase'] ?? (float) ($first['tonase'] ?? 0);
            $data['harga'] = $data['harga'] ?? (float) ($first['harga'] ?? 0);

            $data['rincian'] = $rincian;
        } else {
            $data['rincian'] = null;
        }

        $invoice = Invoice::create($data);

        return response()->json($invoice);
    }

    public function show($id)
    {
        return Invoice::with('armada')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $data = $request->validate([
            'nama_pelanggan'     => 'required',
            'email'              => 'nullable|email',
            'no_telp'            => 'nullable',
            'tanggal'            => 'required|date',
            'due_date'           => 'nullable|date',

            'armada_id'          => 'nullable|exists:armadas,id',
            'armada_start_date'  => 'nullable|date',
            'armada_end_date'    => 'nullable|date',
            'lokasi_muat'        => 'nullable',
            'lokasi_bongkar'     => 'nullable',
            'tonase'             => 'numeric',
            'harga'              => 'numeric',
            'total_biaya'        => 'numeric',
            'pph'                => 'numeric',
            'total_bayar'        => 'numeric',
            'status'             => 'required',
            'diterima_oleh'      => 'nullable',

            'rincian'                        => 'nullable|array',
            'rincian.*.lokasi_muat'          => 'nullable|string',
            'rincian.*.lokasi_bongkar'       => 'nullable|string',
            'rincian.*.armada_id'            => 'nullable|integer|exists:armadas,id',
            'rincian.*.armada_start_date'    => 'nullable|date',
            'rincian.*.armada_end_date'      => 'nullable|date',
            'rincian.*.tonase'               => 'nullable|numeric',
            'rincian.*.harga'                => 'nullable|numeric',
            'rincian.*.total'                => 'nullable|numeric',
        ]);

        $rincian = $request->input('rincian', null);

        if (is_array($rincian) && count($rincian) > 0) {
            $subtotal = 0;

            foreach ($rincian as $r) {
                $tonase = (float) ($r['tonase'] ?? 0);
                $harga  = (float) ($r['harga'] ?? 0);
                $subtotal += ($tonase * $harga);
            }

            $pph = $subtotal * 0.02;
            $totalBayar = $subtotal - $pph;

            $data['total_biaya'] = $subtotal;
            $data['pph'] = $pph;
            $data['total_bayar'] = $totalBayar;

            $first = $rincian[0];

            $data['lokasi_muat'] = $data['lokasi_muat'] ?? ($first['lokasi_muat'] ?? null);
            $data['lokasi_bongkar'] = $data['lokasi_bongkar'] ?? ($first['lokasi_bongkar'] ?? null);
            $data['armada_id'] = $data['armada_id'] ?? ($first['armada_id'] ?? null);
            $data['armada_start_date'] = $data['armada_start_date'] ?? ($first['armada_start_date'] ?? null);
            $data['armada_end_date'] = $data['armada_end_date'] ?? ($first['armada_end_date'] ?? null);
            $data['tonase'] = $data['tonase'] ?? (float) ($first['tonase'] ?? 0);
            $data['harga'] = $data['harga'] ?? (float) ($first['harga'] ?? 0);

            $data['rincian'] = $rincian;
        } else {
            $data['rincian'] = null;
        }

        $invoice->update($data);

        return response()->json($invoice);
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted']);
    }

    private function resolveInvoiceViewName(): string
    {
        if (view()->exists('invoices.invoice')) return 'invoices.invoice';
        if (view()->exists('invoice')) return 'invoice';

        abort(500, "View invoice untuk PDF tidak ditemukan. Buat invoices/invoice.blade.php atau invoice.blade.php");
    }

    public function pdf($id)
    {
        $invoice = Invoice::with('armada')->findOrFail($id);

        $viewName = $this->resolveInvoiceViewName();

        $pdf = Pdf::loadView($viewName, [
            "invoice" => $invoice,
        ])->setPaper("a4", "landscape");

        return response($pdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header(
                'Content-Disposition',
                'inline; filename="invoice-' . $invoice->no_invoice . '.pdf"'
            );
    }

    public function pdfLink($id)
    {
        Invoice::findOrFail($id);

        $base = rtrim(config('app.url'), '/'); // harus https://asnusatrans.online
        return response()->json([
            "url" => $base . "/api/invoices/{$id}/pdf",
        ]);
    }
}
