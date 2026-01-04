<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Armada;
use App\Models\Expense;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ChatbotController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
            'history.*.role' => 'required_with:history|string|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:2000',
        ]);

        $apiKey = config('services.cerebras.key');
        $apiUrl = config('services.cerebras.url', 'https://api.cerebras.ai/v1/chat/completions');
        $model = config('services.cerebras.model', 'llama3.1-70b');

        if (!$apiKey) {
            return response()->json([
                'message' => 'Cerebras API key belum dikonfigurasi.',
            ], 500);
        }

        $user = $request->user();
        $message = $validated['message'];
        $history = $this->sanitizeHistory($validated['history'] ?? []);

        $systemPrompt = $this->buildSystemPrompt($user);
        $context = $this->buildContext($user, $message);

        $messages = array_merge(
            [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'system', 'content' => "Context:\n" . $context],
            ],
            $history,
            [
                ['role' => 'user', 'content' => $message],
            ]
        );

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => 0.2,
            'max_tokens' => 800,
        ];

        $response = Http::withToken($apiKey)
            ->timeout(30)
            ->post($apiUrl, $payload);

        if ($response->failed()) {
            $error = $response->json('error.message')
                ?? $response->json('message')
                ?? Str::limit($response->body(), 500);

            return response()->json([
                'message' => 'Gagal memproses permintaan ke Cerebras.',
                'status' => $response->status(),
                'error' => $error,
            ], 502);
        }

        $data = $response->json();
        $reply = data_get($data, 'choices.0.message.content');

        if (!$reply) {
            return response()->json([
                'message' => 'Respons Cerebras tidak valid.',
            ], 502);
        }

        return response()->json([
            'reply' => $reply,
        ]);
    }

    private function sanitizeHistory(array $history): array
    {
        $clean = [];

        foreach ($history as $item) {
            if (!is_array($item)) {
                continue;
            }

            $role = $item['role'] ?? null;
            $content = $item['content'] ?? null;

            if (!in_array($role, ['user', 'assistant'], true)) {
                continue;
            }

            if (!is_string($content) || trim($content) === '') {
                continue;
            }

            $clean[] = [
                'role' => $role,
                'content' => Str::limit($content, 2000, ''),
            ];
        }

        return array_slice($clean, -8);
    }

    private function buildSystemPrompt($user): string
    {
        $name = $user?->username ?: 'Pengguna';
        $role = $user?->role ?: 'user';

        return implode("\n", [
            'Kamu adalah asisten AI internal untuk dashboard CV ANT.',
            'Fokus menjawab pertanyaan terkait modul Invoice, Expense, Armada/Fleet, Calendar, dan Laporan.',
            'Gunakan data konteks yang diberikan untuk menjawab dengan akurat.',
            'Jika data belum cukup, minta klarifikasi atau arahkan ke halaman yang relevan di dashboard.',
            'Jika Context memuat period, gunakan data period tersebut untuk pertanyaan terkait waktu dan sebutkan rentangnya.',
            'Jangan mengarang data, jangan tampilkan rahasia seperti API key atau token.',
            'Jawab dalam Bahasa Indonesia, ringkas namun informatif.',
            "Profil pengguna: {$name} (role: {$role}).",
        ]);
    }

    private function buildContext($user, string $message): string
    {
        $lower = Str::lower($message);

        $range = $this->detectDateRange($message);
        $rangeStart = $range ? $range['start'] : null;
        $rangeEnd = $range ? $range['end'] : null;

        $wantsInvoice = $this->hasAny($lower, ['invoice', 'tagihan', 'pendapatan', 'income', 'faktur']);
        $wantsExpense = $this->hasAny($lower, ['expense', 'pengeluaran', 'biaya', 'cost']);
        $wantsArmada = $this->hasAny($lower, ['armada', 'fleet', 'truk', 'truck', 'plat']);
        $wantsReport = $this->hasAny($lower, ['laporan', 'report', 'ringkasan', 'summary']);
        $wantsPeriod = $range !== null;

        $wantsInvoiceList = $this->hasAny($lower, ['daftar invoice', 'list invoice', 'semua invoice', 'data invoice']);
        $wantsExpenseList = $this->hasAny($lower, ['daftar expense', 'list expense', 'semua expense', 'data expense', 'daftar pengeluaran']);
        $wantsArmadaList = $this->hasAny($lower, ['daftar armada', 'list armada', 'semua armada', 'data armada', 'daftar truk']);

        $invoiceLimit = $wantsInvoiceList ? 30 : 5;
        $expenseLimit = $wantsExpenseList ? 30 : 5;
        $armadaLimit = $wantsArmadaList ? 30 : 5;

        $invoiceScope = Invoice::query();
        $expenseScope = Expense::query();

        if ($rangeStart && $rangeEnd) {
            $invoiceScope->whereBetween('tanggal', [$rangeStart, $rangeEnd]);
            $expenseScope->whereBetween('tanggal', [$rangeStart, $rangeEnd]);
        }

        $totalIncome = (float) (clone $invoiceScope)->sum('total_bayar');
        $totalExpense = (float) (clone $expenseScope)->sum('total_pengeluaran');
        $invoiceCount = (clone $invoiceScope)->count();
        $expenseCount = (clone $expenseScope)->count();

        $context = [
            'app' => [
                'name' => 'CV ANT Dashboard',
                'modules' => ['Invoice', 'Expense', 'Armada', 'Calendar', 'Laporan'],
            ],
            'user' => [
                'username' => $user?->username,
                'role' => $user?->role,
            ],
            'stats' => [
                'invoice_count' => $invoiceCount,
                'expense_count' => $expenseCount,
                'armada_count' => Armada::count(),
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net' => $totalIncome - $totalExpense,
                'now' => now()->toDateTimeString(),
            ],
        ];

        if ($rangeStart && $rangeEnd && $range) {
            $context['period'] = [
                'label' => $range['label'],
                'start' => $rangeStart->toDateString(),
                'end' => $rangeEnd->toDateString(),
            ];
            $context['stats']['range'] = $range['label'];
        }

        if ($wantsInvoice || $wantsReport || $wantsInvoiceList) {
            $invoiceQuery = Invoice::with('armada')
                ->orderByDesc('tanggal')
                ->limit($invoiceLimit);

            if ($rangeStart && $rangeEnd) {
                $invoiceQuery->whereBetween('tanggal', [$rangeStart, $rangeEnd]);
            }

            $context['latest_invoices'] = $invoiceQuery
                ->get(['id', 'no_invoice', 'nama_pelanggan', 'tanggal', 'status', 'total_bayar', 'armada_id'])
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'no_invoice' => $item->no_invoice,
                        'nama_pelanggan' => $item->nama_pelanggan,
                        'tanggal' => optional($item->tanggal)->toDateString() ?? (string) $item->tanggal,
                        'status' => $item->status,
                        'total_bayar' => $item->total_bayar,
                        'armada' => $item->armada ? [
                            'id' => $item->armada->id,
                            'nama_truk' => $item->armada->nama_truk,
                            'plat_nomor' => $item->armada->plat_nomor,
                        ] : null,
                    ];
                })
                ->values()
                ->all();
        }

        if ($wantsExpense || $wantsReport || $wantsExpenseList) {
            $expenseQuery = Expense::orderByDesc('tanggal')
                ->limit($expenseLimit);

            if ($rangeStart && $rangeEnd) {
                $expenseQuery->whereBetween('tanggal', [$rangeStart, $rangeEnd]);
            }

            $context['latest_expenses'] = $expenseQuery
                ->get(['id', 'no_expense', 'tanggal', 'kategori', 'status', 'total_pengeluaran', 'keterangan'])
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'no_expense' => $item->no_expense,
                        'tanggal' => optional($item->tanggal)->toDateString() ?? (string) $item->tanggal,
                        'kategori' => $item->kategori,
                        'status' => $item->status,
                        'total_pengeluaran' => $item->total_pengeluaran,
                        'keterangan' => $item->keterangan ? Str::limit($item->keterangan, 120) : null,
                    ];
                })
                ->values()
                ->all();
        }

        if ($wantsArmada || $wantsArmadaList) {
            $context['armadas'] = Armada::orderBy('nama_truk')
                ->limit($armadaLimit)
                ->get(['id', 'nama_truk', 'plat_nomor', 'kapasitas', 'status'])
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'nama_truk' => $item->nama_truk,
                        'plat_nomor' => $item->plat_nomor,
                        'kapasitas' => $item->kapasitas,
                        'status' => $item->status,
                    ];
                })
                ->values()
                ->all();
        }

        if ($wantsReport || $wantsPeriod) {
            $summaryStart = $rangeStart ?: now()->startOfMonth();
            $summaryEnd = $rangeEnd ?: now()->endOfMonth();

            $periodIncome = (float) Invoice::whereBetween('tanggal', [$summaryStart, $summaryEnd])->sum('total_bayar');
            $periodExpense = (float) Expense::whereBetween('tanggal', [$summaryStart, $summaryEnd])->sum('total_pengeluaran');
            $periodLabel = $range
                ? $range['label']
                : $this->formatMonthLabel((int) $summaryStart->format('n'), (int) $summaryStart->format('Y'));

            $context['period_summary'] = [
                'label' => $periodLabel,
                'range' => "{$summaryStart->toDateString()} to {$summaryEnd->toDateString()}",
                'income' => $periodIncome,
                'expense' => $periodExpense,
                'net' => $periodIncome - $periodExpense,
            ];
        }

        $tokens = $this->extractTokens($message);
        $matches = $this->searchMatches($tokens);
        if (!empty($matches)) {
            $context['matches'] = $matches;
        }

        return json_encode($context, JSON_UNESCAPED_UNICODE);
    }

    private function hasAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (Str::contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function extractTokens(string $message): array
    {
        preg_match_all('/[A-Za-z0-9\\-]{3,}/', $message, $matches);

        $stop = [
            'invoice', 'expense', 'armada', 'fleet', 'laporan', 'report', 'ringkasan',
            'summary', 'status', 'tanggal', 'customer', 'pelanggan', 'total', 'bayar',
            'pengeluaran', 'pendapatan', 'truk', 'truck', 'daftar', 'list', 'semua',
            'bulan', 'tahun', 'januari', 'februari', 'maret', 'april', 'mei', 'juni',
            'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
            'sekarang', 'berjalan', 'depan', 'berikutnya', 'lalu', 'sebelumnya',
        ];

        $tokens = [];
        foreach ($matches[0] as $token) {
            $lower = Str::lower($token);
            if (in_array($lower, $stop, true)) {
                continue;
            }

            $tokens[] = $token;
        }

        $tokens = array_values(array_unique($tokens));

        return array_slice($tokens, 0, 5);
    }

    private function detectDateRange(string $message): ?array
    {
        $lower = Str::lower($message);
        $now = now();

        $year = null;
        if (preg_match('/\b(20\d{2})\b/', $lower, $match)) {
            $year = (int) $match[1];
        }

        if ($this->hasAny($lower, ['bulan ini', 'bulan sekarang', 'bulan berjalan', 'bulan saat ini'])) {
            $target = $now->copy();
            return [
                'label' => $this->formatMonthLabel($target->month, $target->year),
                'start' => $target->copy()->startOfMonth(),
                'end' => $target->copy()->endOfMonth(),
            ];
        }

        if ($this->hasAny($lower, ['bulan lalu', 'bulan sebelumnya'])) {
            $target = $now->copy()->subMonthNoOverflow();
            return [
                'label' => $this->formatMonthLabel($target->month, $target->year),
                'start' => $target->copy()->startOfMonth(),
                'end' => $target->copy()->endOfMonth(),
            ];
        }

        if ($this->hasAny($lower, ['bulan depan', 'bulan berikutnya'])) {
            $target = $now->copy()->addMonthNoOverflow();
            return [
                'label' => $this->formatMonthLabel($target->month, $target->year),
                'start' => $target->copy()->startOfMonth(),
                'end' => $target->copy()->endOfMonth(),
            ];
        }

        $monthMap = [
            'januari' => 1,
            'februari' => 2,
            'maret' => 3,
            'april' => 4,
            'mei' => 5,
            'juni' => 6,
            'juli' => 7,
            'agustus' => 8,
            'september' => 9,
            'oktober' => 10,
            'november' => 11,
            'desember' => 12,
        ];

        foreach ($monthMap as $name => $month) {
            if (Str::contains($lower, $name)) {
                $targetYear = $year ?: $now->year;
                $target = Carbon::create($targetYear, $month, 1);
                return [
                    'label' => $this->formatMonthLabel($target->month, $target->year),
                    'start' => $target->copy()->startOfMonth(),
                    'end' => $target->copy()->endOfMonth(),
                ];
            }
        }

        return null;
    }

    private function formatMonthLabel(int $month, int $year): string
    {
        $names = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        $monthName = $names[$month] ?? 'Bulan ' . $month;

        return $monthName . ' ' . $year;
    }

    private function searchMatches(array $tokens): array
    {
        if (empty($tokens)) {
            return [];
        }

        $invoiceMatches = Invoice::query()
            ->where(function ($q) use ($tokens) {
                foreach ($tokens as $token) {
                    $like = '%' . $token . '%';
                    $q->orWhere('no_invoice', 'like', $like)
                        ->orWhere('nama_pelanggan', 'like', $like);
                }
            })
            ->limit(5)
            ->get(['id', 'no_invoice', 'nama_pelanggan', 'tanggal', 'status', 'total_bayar'])
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'no_invoice' => $item->no_invoice,
                    'nama_pelanggan' => $item->nama_pelanggan,
                    'tanggal' => optional($item->tanggal)->toDateString() ?? (string) $item->tanggal,
                    'status' => $item->status,
                    'total_bayar' => $item->total_bayar,
                ];
            })
            ->values()
            ->all();

        $expenseMatches = Expense::query()
            ->where(function ($q) use ($tokens) {
                foreach ($tokens as $token) {
                    $like = '%' . $token . '%';
                    $q->orWhere('no_expense', 'like', $like)
                        ->orWhere('kategori', 'like', $like)
                        ->orWhere('keterangan', 'like', $like);
                }
            })
            ->limit(5)
            ->get(['id', 'no_expense', 'tanggal', 'kategori', 'status', 'total_pengeluaran'])
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'no_expense' => $item->no_expense,
                    'tanggal' => optional($item->tanggal)->toDateString() ?? (string) $item->tanggal,
                    'kategori' => $item->kategori,
                    'status' => $item->status,
                    'total_pengeluaran' => $item->total_pengeluaran,
                ];
            })
            ->values()
            ->all();

        $armadaMatches = Armada::query()
            ->where(function ($q) use ($tokens) {
                foreach ($tokens as $token) {
                    $like = '%' . $token . '%';
                    $q->orWhere('nama_truk', 'like', $like)
                        ->orWhere('plat_nomor', 'like', $like);
                }
            })
            ->limit(5)
            ->get(['id', 'nama_truk', 'plat_nomor', 'kapasitas', 'status'])
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama_truk' => $item->nama_truk,
                    'plat_nomor' => $item->plat_nomor,
                    'kapasitas' => $item->kapasitas,
                    'status' => $item->status,
                ];
            })
            ->values()
            ->all();

        $matches = [];
        if (!empty($invoiceMatches)) {
            $matches['invoices'] = $invoiceMatches;
        }
        if (!empty($expenseMatches)) {
            $matches['expenses'] = $expenseMatches;
        }
        if (!empty($armadaMatches)) {
            $matches['armadas'] = $armadaMatches;
        }

        return $matches;
    }
}
