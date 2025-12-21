<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'no_invoice',
        'nama_pelanggan',
        'email',
        'no_telp',
        'tanggal',
        'due_date',
        'armada_id',
        'armada_start_date',
        'armada_end_date',
        'lokasi_muat',
        'lokasi_bongkar',
        'tonase',
        'harga',
        'total_biaya',
        'pph',
        'total_bayar',
        'status',
        'diterima_oleh',
        'rincian',
    ];

    protected $casts = [
        'tanggal'           => 'date',
        'due_date'          => 'date',
        'armada_start_date' => 'date',
        'armada_end_date'   => 'date',
        'tonase'            => 'float',
        'harga'             => 'float',
        'total_biaya'       => 'float',
        'pph'               => 'float',
        'total_bayar'       => 'float',
        'rincian'           => 'array',
    ];

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }
}
