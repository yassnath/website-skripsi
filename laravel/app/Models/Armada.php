<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Armada extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_truk',
        'plat_nomor',
        'kapasitas',
        'status',
    ];

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
