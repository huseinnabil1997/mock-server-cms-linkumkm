# Tutorial: Integrasi API List Notifikasi

Panduan buat rekan yang mau belajar **integrasi frontend ↔ API** pakai mock lokal ini. Tidak butuh backend real — mock ini meniru response halaman **Daftar Notifikasi** CMS LinkUMKM.

Tutorial ini ada **dua jalur**:

| Jalur | Fokus |
|-------|--------|
| **A. Server-side** | Cara mock API bekerja, filter, CORS, menambah endpoint |
| **B. Client-side** | Fetch dari Next.js, mapping response ke UI |

Mulai dari setup dulu (langkah 1–3), lalu pilih jalur A / B / keduanya.

---

## Apa yang kamu pelajari

**Umum**

1. Menjalankan mock API lokal
2. Membaca kontrak API (query + response shape)
3. Hit API dari terminal / Postman (sanity check)

**Server-side**

4. Membaca flow request di `default.ts`
5. Memahami seed data, filter, pagination, CORS
6. Menambah / mengubah endpoint mock dengan aman

**Client-side**

7. Integrasi ke Next.js (env, fetch, mapping ke UI)
8. Filter tab / search seperti di halaman asli

---

## Prasyarat

- Node.js 18+ (`node -v`)
- Repo ini sudah di clone
- TypeScript dijalankan via `tsx` (sudah ada di `devDependencies` setelah `npm install`)
- (Opsional) project Next.js sendiri buat latihan UI

---

## Langkah 1 — Setup mock server

Di folder repo ini:

```bash
npm install
npm run mock
```

Kalau sukses, mock listen di:

```text
http://localhost:4010
```

Biarkan terminal ini tetap jalan. Terminal baru buat hit API / jalankan Next.

---

## Langkah 2 — Kenalan dengan kontrak API

### Endpoint

```http
GET /api/notifications
```

### Query params

| Param | Nilai contoh | Kegunaan di UI |
|-------|--------------|----------------|
| `status` | `all`, `draft`, `pending_approval`, `queued`, `scheduled`, `sent`, `failed`, `returned` | Tab status |
| `q` | `Diskon` | Search bar "Cari notifikasi" |
| `channel` | `all`, `app`, `email` | Dropdown channel |
| `page` | `1` | Pagination |
| `limit` | `10` | Jumlah baris per halaman |

### Bentuk response

```json
{
  "data": [
    {
      "id": "notif-001",
      "title": "Diskon Ongkir untuk Pesanan UMKM",
      "channel": "app",
      "submittedBy": "Adhitya Pratama",
      "subtitle": "Diajukan Adhitya Pratama",
      "status": "sent",
      "statusLabel": "Terkirim",
      "statusDetail": "2.415 gagal terkirim",
      "targetCount": 24180,
      "date": "2026-06-28"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 10
  },
  "counts": {
    "all": 138,
    "draft": 14,
    "pending_approval": 14,
    "queued": 3,
    "scheduled": 13,
    "sent": 90,
    "failed": 2,
    "returned": 2
  }
}
```

Mapping cepat ke UI:

| Field API | Kolom UI |
|-----------|----------|
| `title` + `channel` + `subtitle` | JUDUL |
| `statusLabel` + `statusDetail` | STATUS |
| `targetCount` | SASARAN |
| `date` | TANGGAL |
| `counts.*` | Angka di tiap tab |

Catatan: seed mock cuma **10 baris** (mirip screenshot). `counts` sengaja mengikuti angka di UI asli biar tab terlihat realistis.

---

## Langkah 3 — Coba hit dari terminal dulu

Masih di repo mock (terminal kedua):

```bash
# Semua
npx postman request "http://localhost:4010/api/notifications?status=all"

# Tab Terkirim
npx postman request "http://localhost:4010/api/notifications?status=sent"

# Search
npx postman request "http://localhost:4010/api/notifications?q=Diskon"

# Channel Email
npx postman request "http://localhost:4010/api/notifications?channel=email"
```

Atau buka di browser:

```text
http://localhost:4010/api/notifications?status=all
```

Kalau JSON muncul → API siap dipakai (client) / siap diutak-atik (server).

---

## Jalur A — Server-side (cara mock API bekerja)

File utama: `postman/mocks/notification-list/default.ts` (TypeScript, dijalankan lewat `tsx`)

Ini **bukan** framework berat — cuma Node `http` server. Cocok buat paham “request masuk → response keluar” tanpa distraksi.

### A1. Alur request (big picture)

```text
Client (Postman / Next)
        │  GET /api/notifications?status=sent
        ▼
http.createServer  →  parse URL + method
        │
        ├─ OPTIONS?  →  balas CORS preflight (204)
        ├─ GET /api/notifications?  →  listNotifications(url) → JSON 200
        └─ selain itu  →  404 { error: "Endpoint not defined" }
```

### A2. Bagian-bagian penting di `default.ts`

| Bagian | Fungsi |
|--------|--------|
| Types (`NotificationItem`, dll.) | Kontrak data TypeScript (status, channel, response) |
| `PORT` | Port listen (default `4010`, override pakai env `PORT`) |
| `COUNTS` | Angka di tiap tab UI (mirip screenshot) |
| `NOTIFICATIONS` | Seed data 10 baris list |
| `CORS_HEADERS` | Biar browser (Next di `:3000`) boleh cross-origin hit |
| `sendJson()` | Helper: set status + header + `JSON.stringify` |
| `listNotifications(url)` | Baca query → filter → paginate → bentuk response |
| `http.createServer(...)` | Routing method + path |

### A3. Baca query & filter (inti server)

Di `listNotifications`:

1. Ambil query: `status`, `channel`, `q`, `page`, `limit`
2. Clone array seed: `NOTIFICATIONS.slice()`
3. Filter berurutan (status → channel → search judul)
4. Hitung `total` dari hasil filter
5. Slice untuk pagination: `filtered.slice(start, start + limit)`
6. Return `{ data, meta, counts }`

Coba sendiri (mock harus jalan):

```bash
# tanpa filter → 10 item seed
npx postman request "http://localhost:4010/api/notifications?status=all"

# server filter status=sent → 2 item
npx postman request "http://localhost:4010/api/notifications?status=sent"

# server filter q=Diskon → 1 item
npx postman request "http://localhost:4010/api/notifications?q=Diskon"
```

Kalau hasilnya berubah sesuai query → filter di **server** yang jalan, bukan di client.

### A4. Kenapa ada CORS + OPTIONS?

Next.js jalan di `localhost:3000`, mock di `localhost:4010` → beda origin.

- Browser kirim **preflight** `OPTIONS` dulu
- Server harus balas header `Access-Control-Allow-*`
- Baru request `GET` yang sebenarnya diizinkan

Tanpa ini, client browser kena CORS error meski Postman (bukan browser) tetap sukses.

### A5. Latihan server-side

Kerjakan di `default.ts`, restart mock tiap kali edit (`Ctrl+C` lalu `npm run mock` — **tidak ada hot reload**).

1. **Tambah field** di salah satu item seed, mis. `"priority": "high"`, hit ulang, pastikan muncul di JSON
2. **Filter baru**: query `priority=high` (opsional) — kalau ada, filter item yang match
3. **Endpoint baru** `GET /api/notifications/:id` (atau `?id=notif-001`) yang return 1 item / 404
4. **Error case**: kalau `limit` > 50, balas `400` + `{ "error": "limit max 50" }`
5. **Update collection** (opsional): tambah example di folder `postman/collections/...` biar kontrak ikut berubah

Checklist server:

- [ ] Bisa jelasin alur `createServer` → route → `listNotifications`
- [ ] Ubah seed → response ikut berubah setelah restart
- [ ] Tambah filter / endpoint kecil sendiri
- [ ] Paham kenapa CORS dibutuhkan buat Next

---

## Jalur B — Client-side (integrasi Next.js)

### 4.1 Env

Di project Next.js kamu, buat `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4010
```

Restart `npm run dev` setelah ubah env.

### 4.2 Type (TypeScript)

```ts
// types/notification.ts
export type NotificationStatus =
  | 'draft'
  | 'pending_approval'
  | 'queued'
  | 'scheduled'
  | 'sent'
  | 'failed'
  | 'returned';

export type NotificationChannel = 'app' | 'email';

export interface NotificationItem {
  id: string;
  title: string;
  channel: NotificationChannel;
  submittedBy: string | null;
  subtitle: string | null;
  status: NotificationStatus;
  statusLabel: string;
  statusDetail: string | null;
  targetCount: number | null;
  date: string | null;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  counts: Record<'all' | NotificationStatus, number>;
}
```

### 4.3 Fetch helper

```ts
// lib/notifications.ts
import type { NotificationListResponse } from '@/types/notification';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export async function getNotifications(params?: {
  status?: string;
  q?: string;
  channel?: string;
  page?: number;
  limit?: number;
}): Promise<NotificationListResponse> {
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL belum di-set');
  }

  const search = new URLSearchParams();
  search.set('status', params?.status ?? 'all');
  search.set('channel', params?.channel ?? 'all');
  search.set('page', String(params?.page ?? 1));
  search.set('limit', String(params?.limit ?? 10));
  if (params?.q) search.set('q', params.q);

  const res = await fetch(`${baseUrl}/api/notifications?${search}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch notifikasi: ${res.status}`);
  }

  return res.json();
}
```

### 4.4 Pakai di page / client component

Contoh sederhana (Client Component + tab status):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getNotifications } from '@/lib/notifications';
import type { NotificationListResponse } from '@/types/notification';

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'draft', label: 'Draf' },
  { key: 'pending_approval', label: 'Menunggu Persetujuan' },
  { key: 'queued', label: 'Menunggu Antrean' },
  { key: 'scheduled', label: 'Terjadwal' },
  { key: 'sent', label: 'Terkirim' },
  { key: 'failed', label: 'Gagal' },
  { key: 'returned', label: 'Dikembalikan' },
] as const;

export default function NotificationListPage() {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [result, setResult] = useState<NotificationListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getNotifications({ status, q: q || undefined });
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, q]);

  return (
    <div>
      <h1>Daftar Notifikasi</h1>

      <input
        placeholder="Cari notifikasi"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatus(tab.key)}
          >
            {tab.label} {result?.counts[tab.key] ?? 0}
          </button>
        ))}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p>Error: {error}</p>}

      <ul>
        {result?.data.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> · {item.statusLabel}
            {item.statusDetail ? ` — ${item.statusDetail}` : ''}
            <br />
            Sasaran: {item.targetCount ?? '-'} · Tanggal: {item.date ?? '-'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Workflow lokal:

1. Terminal A: `npm run mock` (repo mock)
2. Terminal B: `npm run dev` (repo Next)
3. Buka page notifikasi di browser

---

## Langkah 5 — Checklist “udah paham integrasi”

**Server**

- [ ] Bisa baca & jelasin `default.ts`
- [ ] Filter `status` / `q` terasa dari response (bukan cuma teori)
- [ ] Pernah edit seed / tambah logic kecil + restart mock

**Client**

- [ ] Mock jalan di `:4010`
- [ ] Bisa lihat JSON di browser / Postman / `postman request`
- [ ] Next.js baca `NEXT_PUBLIC_API_URL`
- [ ] List muncul di UI dari `data`
- [ ] Klik tab → `status` berubah → list ikut filter
- [ ] Ketik search → `q` terkirim → hasil menyempit
- [ ] `counts` dipakai buat angka di tab
- [ ] Handle loading + error (mock mati → pesan error jelas)

---

## Troubleshooting

| Gejala | Cek |
|--------|-----|
| `ECONNREFUSED` / Failed to fetch | Mock belum jalan → `npm run mock` |
| CORS error | Mock harus versi yang ada CORS (file `default.ts` di repo ini sudah include) |
| Env kosong / URL undefined | Pastikan `.env.local` + restart Next |
| Tab filter kosong | Cek value `status` harus snake_case Inggris (`pending_approval`, bukan label UI) |
| Port 4010 dipakai | `npm run mock` otomatis free-kan port dulu; atau `npm run mock:stop` |

Jalankan mock di port lain:

```bash
# Windows PowerShell
$env:PORT=4011; npm run mock
```

---

## Referensi file di repo ini

| Path | Isi |
|------|-----|
| `postman/mocks/notification-list/default.ts` | Logic mock + seed data (TypeScript) |
| `postman/collections/cms-linkumkm-notifications/` | Kontrak request + example 200 |
| `postman/environments/local.yaml` | `baseUrl` local |
| `README.md` | Ringkasan cepat run |

Kalau mau lihat contoh response lengkap, buka example di:

`postman/collections/cms-linkumkm-notifications/.resources/list-notifications.resources/examples/200-ok.example.yaml`

---

## Latihan lanjutan (opsional)

**Client**

1. Tambah debounce di search (jangan fetch tiap keystroke)
2. Format `targetCount` jadi `24.180` (locale `id-ID`)
3. Badge warna per `status` (hijau `sent`, merah `failed`, dst.)
4. Empty state kalau `data.length === 0`
5. Skeleton loading saat fetch

**Server**

6. Endpoint detail by id + status 404
7. Validasi query (`page`/`limit` invalid → 400)
8. Sort by `date` descending
9. Simulasikan delay (`setTimeout`) biar client bisa latihan loading state
10. Pisahkan seed ke file `data/notifications.json` lalu `import` di `default.ts`

Selesai latihan di atas = kamu udah siap integrasi API list yang mirip production (baik sisi server mock maupun client).
