@php
function rupiah($n){
    return 'Rp '.number_format($n ?? 0, 0, ',', '.');
}

function tgl($date){
    if(!$date) return '-';
    return date('d-m-Y', strtotime($date));
}
@endphp

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $rangeLabel }} - {{ $periodLabel }}</title>

<style>
    @page { size: A4 landscape; margin: 10mm 10mm; }
    body {
        font-family: DejaVu Sans, Arial, sans-serif;
        font-size: 12px;
        color:#222;
        line-height:1.5;
    }

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
    .title-main{ margin:0; font-size:28px; font-weight:700; color:#111; }
    .info-line{ margin:2px 0; font-size:12px; }

    table.report{
        width:100%;
        border-collapse:collapse;
        margin-top:10px;
        table-layout:fixed;
        background:#fff;
    }
    table.report thead th{
      background:#222; color:#fff; 
      text-align:center; padding:6px; 
      font-size:12px; border:1px solid #222;
    }
    table.report tbody td{
      text-align:center; padding:6px 5px; 
      border:1px solid #ccc; font-size:12px;
      word-wrap:break-word;
    }

    table.totals{ width:40%; margin-left:auto; margin-top:10px; border-collapse:collapse; }
    table.totals td{ border:none; padding:5px; font-size:12px; }
    table.totals td:first-child{ text-align:left; }
    table.totals td:last-child{ text-align:right; }
    table.totals tr.bold td{ font-weight:700; background:#f6f6f6; }

    .footer{ margin-top:12px; color:#666; font-size:11px; text-align:center; }
    .sign{ margin-top:40px; text-align:right; font-size:12px; }
    .sign .bold{ font-weight:700; }
</style>

</head>
<body>

<div class="watermark">
    <img src="{{ public_path('assets/images/icon.png') }}" alt="logo">
</div>

<table class="twocol">
    <tr>
        <td class="left">
            <h2 class="company-title">CV AS Nusa Trans</h2>
            <p class="company-line">Ruko Graha Kota Blok BB-07, Suko, Sidoarjo</p>
            <p class="company-line">Email: asnusa.trans@gmail.com | Telp: 0812-3425-9399</p>
        </td>

        <td class="right">
            <h2 class="title-main">{{ $rangeLabel }}</h2>
            <p class="info-line"><strong>Periode:</strong> {{ $periodLabel }}</p>
            <p class="info-line"><strong>Dicetak:</strong> {{ $generatedAt }}</p>
        </td>
    </tr>
</table>

<div style="margin-top: 15px;"></div>

<table class="report">
    <thead>
        <tr>
            <th style="width:6%;">No</th>
            <th style="width:30%;">Nomor Dokumen</th>
            <th style="width:18%;">Tanggal</th>
            <th style="width:23%;">Income</th>
            <th style="width:23%;">Expense</th>
        </tr>
    </thead>

    <tbody>
        @forelse($rows as $row)
        <tr>
            <td>{{ $row['no'] }}</td>
            <td>{{ $row['nomor'] }}</td>
            <td>{{ tgl($row['tanggal']) }}</td>

            <td>
                @if(($row['income'] ?? 0) > 0)
                    Rp {{ number_format($row['income'],0,',','.') }}
                @else
                    -
                @endif
            </td>

            <td>
                @if(($row['expense'] ?? 0) > 0)
                    Rp {{ number_format($row['expense'],0,',','.') }}
                @else
                    -
                @endif
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="5">Tidak ada data</td>
        </tr>
        @endforelse
    </tbody>
</table>

@php
    $fmtIncome  = rupiah($totalIncome);
    $fmtExpense = rupiah($totalExpense);
    $fmtNet = $net >= 0 
        ? rupiah($net)
        : '- '.rupiah(abs($net));
@endphp

<table class="totals">
    <tr><td><strong>Total Income</strong></td><td>{{ $fmtIncome }}</td></tr>
    <tr><td><strong>Total Expense</strong></td><td>{{ $fmtExpense }}</td></tr>
    <tr class="bold">
        <td>Selisih (Income - Expense)</td>
        <td>{{ $fmtNet }}</td>
    </tr>
</table>

<div class="sign">
    <div>Hormat kami,</div>
    <div style="height: 50px;"></div>
    <div class="bold">{{ $ownerName }}</div>
    <div>Owner CV ANT</div>
</div>

</body>
</html>
