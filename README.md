# mock-server-cms-linkumkm

Mock lokal untuk API CMS LinkUMKM. Fokus sekarang: **list notifikasi** via Postman mock.

**Belajar integrasi API?** Baca [TUTORIAL.md](./TUTORIAL.md) — dari jalankan mock sampai fetch di Next.js + checklist latihan.

## Setup (sekali)

```bash
npm install
```

Install cuma local di repo ini (`node_modules/` di disk D), bukan `npm -g`.

## Jalankan mock list notifikasi

```bash
npm run mock
```

Sebelum start, script otomatis **mengosongkan port 4010** kalau masih kepakai proses lama. Stop: `Ctrl+C`, atau `npm run mock:stop`.

Server: `http://localhost:4010`

Endpoint:

```text
GET /api/notifications
```

Query:

| Param | Contoh | Fungsi |
|-------|--------|--------|
| `status` | `all`, `draft`, `pending_approval`, `queued`, `scheduled`, `sent`, `failed`, `returned` | Filter tab |
| `q` | `Diskon` | Cari judul |
| `channel` | `all`, `app`, `email` | Filter channel |
| `page` | `1` | Halaman |
| `limit` | `10` | Ukuran halaman |

Contoh hit:

```bash
npx postman request "http://localhost:4010/api/notifications?status=all"
npx postman request "http://localhost:4010/api/notifications?status=sent"
npx postman request "http://localhost:4010/api/notifications?q=Diskon"
```

CORS sudah diaktifkan (`Access-Control-Allow-Origin: *`) + `OPTIONS` preflight, jadi aman di-hit dari browser.

## Pakai dari Next.js lokal

Di frontend (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4010
```

Fetch:

```ts
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?status=all`)
```

Workflow: terminal 1 `npm run mock` → terminal 2 `npm run dev` (Next) → page hit mock.

Alternatif tanpa CORS di browser: rewrite di `next.config` dari `/api/notifications` ke `http://localhost:4010/api/notifications`.

## Struktur Postman

- `postman/collections/cms-linkumkm-notifications/` — kontrak + example 200
- `postman/environments/local.yaml` — `baseUrl=http://localhost:4010`
- `postman/mocks/notification-list/` — mock server (`default.ts` + `config.yaml`)

Regenerate mock dari collection (overwrite):

```bash
npm run mock:generate
```

Setelah generate, logic filter/CORS di `default.ts` perlu di-restore kalau ter-overwrite — file itu yang jadi sumber kebenaran behavior mock. Jalankan selalu lewat `npm run mock` (tsx), bukan `postman mock run` yang expect `.js`.
