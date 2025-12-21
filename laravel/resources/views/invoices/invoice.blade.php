@php
function rupiah($n){ return 'Rp '.number_format($n ?? 0,0,',','.'); }

function tgl($date) {
    if (!$date) return '-';
    return date('d-m-Y', strtotime($date));
}

function toInt($v){
    return (int) round((float) ($v ?? 0));
}

$rin = $invoice->rincian ?? null;

if (is_string($rin)) {
    $decoded = json_decode($rin, true);
    $rin = is_array($decoded) ? $decoded : [];
}

$hasRincian = is_array($rin) && count($rin) > 0;

// mapping armada_id => plat_nomor
$armadasMap = \App\Models\Armada::query()
    ->select('id','plat_nomor')
    ->get()
    ->mapWithKeys(fn($a) => [ (string)$a->id => ($a->plat_nomor ?? '') ])
    ->all();

$rows = [];

if ($hasRincian) {
    foreach ($rin as $r) {
        $ton = toInt($r['tonase'] ?? 0);
        $hrg = toInt($r['harga'] ?? 0);
        $rowSubtotal = $ton * $hrg;

        $directPlat =
            ($r['armada']['plat_nomor'] ?? null) ??
            ($r['armada_plat'] ?? null) ??
            ($r['plat_nomor'] ?? null) ??
            ($r['plat'] ?? null) ??
            '';

        $armadaId = isset($r['armada_id']) ? (string) $r['armada_id'] : '';
        $platFromMap = ($armadaId && isset($armadasMap[$armadaId]) && trim($armadasMap[$armadaId]) !== '')
            ? $armadasMap[$armadaId]
            : '';

        $plat = trim((string)$directPlat) !== '' ? (string)$directPlat : ($platFromMap !== '' ? $platFromMap : '-');

        $rows[] = [
            'lokasi_muat' => $r['lokasi_muat'] ?? '-',
            'lokasi_bongkar' => $r['lokasi_bongkar'] ?? '-',
            'armada_plat' => $plat,
            'armada_start_date' => $r['armada_start_date'] ?? null,
            'armada_end_date' => $r['armada_end_date'] ?? null,
            'tonase' => $ton,
            'harga' => $hrg,
            'subtotal' => $rowSubtotal,
        ];
    }
} else {
    $ton = toInt($invoice->tonase ?? 0);
    $hrg = toInt($invoice->harga ?? 0);
    $rowSubtotal = $ton * $hrg;

    $rows[] = [
        'lokasi_muat' => $invoice->lokasi_muat ?? '-',
        'lokasi_bongkar' => $invoice->lokasi_bongkar ?? '-',
        'armada_plat' => optional($invoice->armada)->plat_nomor ?: '-',
        'armada_start_date' => $invoice->armada_start_date ?? null,
        'armada_end_date' => $invoice->armada_end_date ?? null,
        'tonase' => $ton,
        'harga' => $hrg,
        'subtotal' => $rowSubtotal,
    ];
}

$subtotal = array_reduce($rows, fn($sum, $r) => $sum + (int)($r['subtotal'] ?? 0), 0);
$pph      = (int) round($subtotal * 0.02);
$total    = $subtotal - $pph;

/** ✅ sama seperti InvoicePreviewLayer:
 *  jika baris > 3 => portrait, selain itu => landscape
 */
$isPortrait = count($rows) > 3;
@endphp

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Invoice {{ $invoice->no_invoice }}</title>

<style>
  /* ✅ hanya ini yang diubah: orientation dinamis */
  @page { size: A4 {{ $isPortrait ? 'portrait' : 'landscape' }}; margin: 10mm 10mm; }

  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color:#222; line-height:1.5; }

  .watermark{
      position:fixed;
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      opacity:.07;
      z-index:-1;
  }
  .watermark img{ width:500px; }

  .twocol, .twocol-50, .armada-summary-table {
      width:100%; border-collapse:collapse; table-layout:fixed;
  }

  .twocol td{ padding:0; vertical-align:top; }
  .twocol .left { width:60%; text-align:left; }
  .twocol .right{ width:40%; text-align:right; }

  .twocol-50 td{ width:50%; padding:0; vertical-align:top; }
  .twocol-50 .left { text-align:left; padding-right:10px; }
  .twocol-50 .right{ text-align:right; padding-left:10px; }

  .company-title{ font-size:22px; font-weight:700; margin:0; color:#0056b3; }
  .company-line, .info-line{ font-size:12px; margin:2px 0; }
  .invoice-title{ font-size:28px; font-weight:700; margin:0; color:#111; }

  .invoice-table-wrap{
    padding: 0;
    margin-top: 14px;
  }

  table.detail{
      width:100%;
      border-collapse:collapse;
      table-layout:fixed;
      background:#fff;
  }

  table.detail th{
      background:#222;
      color:#fff;
      padding:6px;
      border:1px solid #222;
      text-align:center;
      vertical-align:middle;
      font-size:12px;
      font-weight:700;
      white-space:nowrap;
  }

  table.detail td{
      padding:6px;
      border:1px solid #ccc;
      text-align:center;
      vertical-align:middle;
      font-size:12px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
  }

  table.detail th:nth-child(1),
  table.detail td:nth-child(1){ width: 23%; }
  table.detail th:nth-child(2),
  table.detail td:nth-child(2){ width: 23%; }
  table.detail th:nth-child(3),
  table.detail td:nth-child(3){ width: 9%; }
  table.detail th:nth-child(4),
  table.detail td:nth-child(4){ width: 9%; }
  table.detail th:nth-child(5),
  table.detail td:nth-child(5){ width: 9%; }
  table.detail th:nth-child(6),
  table.detail td:nth-child(6){ width: 8%; }
  table.detail th:nth-child(7),
  table.detail td:nth-child(7){ width: 9%; }
  table.detail th:nth-child(8),
  table.detail td:nth-child(8){ width: 11%; }

  /* ARMADA + SUMMARY */
  .armada-summary-table td{
      vertical-align:top;
      padding-top:10px;
  }
  .armada-left{
      width:50%;
      font-size:12px;
      padding-right:10px;
  }
  .armada-left p{ margin:3px 0; }

  .summary-right{ width:50%; }

  table.totals{
      width:100%;
      border-collapse:collapse;
  }
  table.totals td{
      padding:5px;
      font-size:12px;
  }
  table.totals td:first-child{ text-align:left; }
  table.totals td:last-child{ text-align:right; }
  table.totals tr.bold td{
      font-weight:700;
      background:#f2f2f2;
  }

  .status-block{ margin-top:12px; }
  .status-block p{ margin:2px 0; }

  .footer{ margin-top:24px; text-align:center; color:#555; font-size:11px; }
  .sign{ margin-top:40px; text-align:right; font-size:12px; }
  .sign .bold{ font-weight:700; }
</style>

</head>
<body>

  {{-- WATERMARK --}}
  <div class="watermark">
    <img src="{{ public_path('assets/images/icon.png') }}" alt="Logo">
  </div>

  {{-- HEADER --}}
  <table class="twocol">
    <tr>
      <td class="left">
        <h2 class="company-title">CV AS Nusa Trans</h2>
        <p class="company-line">Ruko Graha Kota Blok BB-07, Suko, Sidoarjo</p>
        <p class="company-line">Email: asnusa.trans@gmail.com | Telp: 0812-3425-9399</p>
      </td>

      <td class="right">
        <h2 class="invoice-title">INVOICE</h2>
        <p class="info-line"><strong>No. Invoice:</strong> {{ $invoice->no_invoice }}</p>
        <p class="info-line"><strong>Tanggal:</strong> {{ tgl($invoice->tanggal) }}</p>
        <p class="info-line"><strong>Jatuh Tempo:</strong> {{ $invoice->due_date ? tgl($invoice->due_date) : '-' }}</p>
      </td>
    </tr>
  </table>

  {{-- CUSTOMER INFO --}}
  <table class="twocol-50">
    <tr>
      <td class="left">
        <strong>Dari:</strong><br>
        CV. AS Nusa Trans<br>
        Ruko Graha Kota Blok BB-07, Sidoarjo<br>
        Telp: 0812-3425-9399 | asnusa.trans@gmail.com
      </td>

      <td class="right">
        <strong>Kepada:</strong><br>
        {{ $invoice->nama_pelanggan }}<br>
        {{ $invoice->email }}<br>
        {{ $invoice->no_telp }}
      </td>
    </tr>
  </table>

  {{-- DETAIL TABLE --}}
  <div class="invoice-table-wrap">
    <table class="detail">
      <thead>
        <tr>
          <th>Lokasi Muat</th>
          <th>Lokasi Bongkar</th>
          <th>Armada</th>
          <th>Berangkat</th>
          <th>Sampai</th>
          <th>Tonase</th>
          <th>Harga / Ton</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        @foreach($rows as $r)
          <tr>
            <td title="{{ $r['lokasi_muat'] ?? '-' }}">{{ $r['lokasi_muat'] ?? '-' }}</td>
            <td title="{{ $r['lokasi_bongkar'] ?? '-' }}">{{ $r['lokasi_bongkar'] ?? '-' }}</td>
            <td>{{ $r['armada_plat'] ?? '-' }}</td>
            <td>{{ !empty($r['armada_start_date']) ? tgl($r['armada_start_date']) : '-' }}</td>
            <td>{{ !empty($r['armada_end_date']) ? tgl($r['armada_end_date']) : '-' }}</td>
            <td>{{ number_format((float) ($r['tonase'] ?? 0), 0, ',', '.') }}</td>
            <td>{{ rupiah($r['harga'] ?? 0) }}</td>
            <td>{{ rupiah($r['subtotal'] ?? 0) }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  </div>

  <table class="armada-summary-table">
    <tr>
      <td class="armada-left"></td>
      <td class="summary-right">
        <table class="totals">
          <tr><td>Subtotal</td><td>{{ rupiah($subtotal) }}</td></tr>
          <tr><td>PPH (2%)</td><td>{{ rupiah($pph) }}</td></tr>
          <tr class="bold"><td>Total Bayar</td><td>{{ rupiah($total) }}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  {{-- STATUS --}}
  <div class="status-block">
    <p><strong>Status:</strong> {{ $invoice->status }}</p>
    <p><strong>Diterima oleh:</strong> {{ $invoice->diterima_oleh ?: 'Admin' }}</p>
  </div>

  {{-- FOOTER --}}
  <div class="footer">
    Mohon lakukan pembayaran sebelum tanggal jatuh tempo. <br>
    Harap konfirmasi pembayaran melalui WhatsApp: 0812-3425-9399.
  </div>

  <div class="sign">
    <div>Hormat kami,</div>
    <div style="height: 40px;"></div>
    <div class="bold">CV ANT</div>
  </div>

</body>
</html>
