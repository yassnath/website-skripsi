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

        // tetap pakai cast array
        'rincian'           => 'array',
    ];

    /**
     * ✅ FIX HARDENING:
     * - Jika data lama di DB tersimpan sebagai string JSON (bahkan double-encoded),
     *   kita decode sampai jadi array.
     */
    public function getRincianAttribute($value)
    {
        if ($value === null) return [];

        // Kalau sudah array dari cast
        if (is_array($value)) return $value;

        // Kalau value dari DB biasanya string
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            // kalau decode berhasil dan jadi array
            if (is_array($decoded)) {
                // handle kasus double-encoded: ["{\"a\":1}"] dll
                // kalau isinya string json lagi, coba decode tiap item
                $fixed = [];
                foreach ($decoded as $item) {
                    if (is_string($item)) {
                        $try = json_decode($item, true);
                        $fixed[] = is_array($try) ? $try : $item;
                    } else {
                        $fixed[] = $item;
                    }
                }
                return $fixed;
            }

            // kalau decode gagal → anggap kosong
            return [];
        }

        // tipe aneh → anggap kosong
        return [];
    }

    /**
     * ✅ FIX HARDENING:
     * - Saat menyimpan, pastikan rincian selalu tersimpan sebagai JSON (array).
     */
    public function setRincianAttribute($value)
    {
        if ($value === null) {
            $this->attributes['rincian'] = null;
            return;
        }

        // kalau string JSON dari request
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $this->attributes['rincian'] = json_encode($decoded);
                return;
            }

            // string biasa → simpan null biar gak ngerusak format
            $this->attributes['rincian'] = null;
            return;
        }

        // kalau array/obj
        if (is_array($value)) {
            $this->attributes['rincian'] = json_encode($value);
            return;
        }

        // fallback
        $this->attributes['rincian'] = null;
    }

    public function armada()
    {
        return $this->belongsTo(Armada::class);
    }
}
