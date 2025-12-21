<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'no_expense',
        'tanggal',
        'kategori',
        'keterangan',
        'total_pengeluaran',
        'status',
        'dicatat_oleh',
        'rincian',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'total_pengeluaran' => 'float',
        'rincian' => 'array',
    ];
}
