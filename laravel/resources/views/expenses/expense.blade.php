@php
function rupiah($n){ return 'Rp '.number_format($n ?? 0,0,',','.'); }

function tgl($date) {
    if (!$date) return '-';
    return date('d-m-Y', strtotime($date));
}
@endphp

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Expense {{ $expense->no_expense }}</title>

    <style>
        @page { size: A4 landscape; margin: 10mm 10mm; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color:#222; line-height:1.5; }

        .watermark{
            position:fixed; 
            top:50%; left:50%;
            transform:translate(-50%,-50%);
            opacity:.07; 
            z-index:-1;
        }
        .watermark img{ width:500px; }

        .twocol{ width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:12px; }
        .twocol td{ vertical-align:top; padding:0; border:none; }
        .twocol .left{ width:60%; text-align:left; }
        .twocol .right{ width:40%; text-align:right; }

        .company-title{ margin:0; color:#0056b3; font-size:22px; font-weight:700; }
        .company-line{ margin:2px 0; font-size:12px; }
        .expense-title{ margin:0; font-size:28px; font-weight:700; color:#111; }
        .info-line{ margin:2px 0; font-size:12px; }

        .twocol-50{ width:100%; border-collapse:collapse; table-layout:fixed; margin-bottom:10px; }
        .twocol-50 td{ vertical-align:top; padding:0; border:none; width:50%; }
        .twocol-50 .left { text-align:left; padding-right:8px; }
        .twocol-50 .right{ text-align:right; padding-left:8px; }
        .label{ font-weight:700; margin-bottom:3px; }

        table.detail{ width:100%; border-collapse:collapse; margin-top:10px; table-layout:fixed; }
        table.detail thead th{
        background:#222; color:#fff; text-align:center; padding:6px; font-size:12px; border:1px solid #222;
        }
        table.detail tbody td{
        text-align:center; padding:6px 5px; border:1px solid #ccc; font-size:12px; word-wrap:break-word;
        }

        table.totals{ width:40%; margin-left:auto; margin-top:10px; border-collapse:collapse; }
        table.totals td{ border:none; padding:5px; font-size:12px; }
        table.totals td:first-child{ text-align:left; }
        table.totals td:last-child{ text-align:right; }
        table.totals tr.bold td{ font-weight:700; background:#f6f6f6; }

        .status-block{ margin-top:10px; font-size:12px; }
        .status-block p{ margin:2px 0; }

        .footer{ margin-top:24px; text-align:center; color:#666; font-size:11px; }
        .sign{ margin-top:40px; text-align:right; font-size:12px; }
        .sign .bold{ font-weight:700; }
    </style>

</head>
<body>

    <div class="watermark">
        <img src="{{ public_path('assets/images/icon.png') }}" alt="Logo">
    </div>

    <table class="twocol">
        <tr>
            <td class="left">
                <h2 class="company-title">CV AS Nusa Trans</h2>
                <p class="company-line">Ruko Graha Kota Blok BB-07, Suko, Sidoarjo</p>
                <p class="company-line">Email: asnusa.trans@gmail.com | Telp: 0812-3425-9399</p>
            </td>
            <td class="right">
                <h2 class="expense-title">EXPENSE</h2>
                <p class="info-line"><strong>No. Expense:</strong> {{ $expense->no_expense }}</p>
                <p class="info-line"><strong>Tanggal:</strong> {{ tgl($expense->tanggal) }}</p>
            </td>
        </tr>
    </table>

    <div style="margin-top: 15px;"></div>

    <table class="detail">
        <thead>
            <tr>
                <th>Nama Pengeluaran</th>
                <th>Jumlah (Rp)</th>
            </tr>
        </thead>
    
        <tbody>
    
            @php
                // Convert to array safely
                $details = is_array($expense->details ?? null)
                    ? $expense->details
                    : [];
            @endphp
    
            @foreach($details as $d)
                <tr>
                    <td>{{ $d->nama }}</td>
                    <td>{{ rupiah($d->jumlah) }}</td>
                </tr>
            @endforeach
    
            @if(count($details) === 0)
                <tr>
                    <td colspan="2">Tidak ada rincian</td>
                </tr>
            @endif
    
        </tbody>
    </table>
    
    <table class="totals">
        <tr class="bold">
            <td>Total Pengeluaran</td>
            <td>{{ rupiah($expense->total_pengeluaran) }}</td>
        </tr>
    </table>    

    <div class="status-block">
        <p><strong>Status:</strong> {{ $expense->status }}</p>
        <p><strong>Dicatat Oleh:</strong> {{ $expense->dicatat_oleh }}</p>
    </div>

    <div class="footer">
        Terima kasih.<br>
        Laporan pengeluaran ini dibuat sebagai dokumentasi internal perusahaan.
    </div>

    <div class="sign">
        <div>Hormat kami,</div>
        <div style="height: 50px;"></div>
        <div class="bold">CV ANT</div>
    </div>

</body>
</html>