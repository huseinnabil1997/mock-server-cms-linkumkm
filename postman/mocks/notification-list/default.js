/**
 * Local mock: GET /api/notifications
 * Seed data mirrors CMS LinkUMKM Daftar Notifikasi screenshot.
 */
const http = require('http');

const PORT = process.env.PORT || 4010;

const COUNTS = {
  all: 138,
  draft: 14,
  pending_approval: 14,
  queued: 3,
  scheduled: 13,
  sent: 90,
  failed: 2,
  returned: 2,
};

const NOTIFICATIONS = [
  {
    id: 'notif-001',
    title: 'Diskon Ongkir untuk Pesanan UMKM',
    channel: 'app',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'sent',
    statusLabel: 'Terkirim',
    statusDetail: '2.415 gagal terkirim',
    targetCount: 24180,
    date: '2026-06-28',
  },
  {
    id: 'notif-002',
    title: 'Pengingat Bayar Tagihan (Gagal)',
    channel: 'app',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'failed',
    statusLabel: 'Gagal Terkirim',
    statusDetail: 'Semua gagal terkirim',
    targetCount: 31520,
    date: '2026-06-22',
  },
  {
    id: 'notif-003',
    title: 'Kelas Online Atur Modal Usaha',
    channel: 'app',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama. Kirim ulang ke semua 96.820 penerima',
    status: 'pending_approval',
    statusLabel: 'Menunggu Persetujuan',
    statusDetail: 'di Admin Ops',
    targetCount: 96820,
    date: '2026-06-11',
  },
  {
    id: 'notif-004',
    title: 'Email •',
    channel: 'email',
    submittedBy: null,
    subtitle: null,
    status: 'draft',
    statusLabel: 'Draf',
    statusDetail: null,
    targetCount: null,
    date: null,
  },
  {
    id: 'notif-005',
    title: 'Kelas Online Atur Modal Usaha',
    channel: 'email',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'sent',
    statusLabel: 'Terkirim',
    statusDetail: null,
    targetCount: 19640,
    date: '2026-06-27',
  },
  {
    id: 'notif-006',
    title: 'Bazar Ramadan UMKM Nasional',
    channel: 'app',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'scheduled',
    statusLabel: 'Terjadwal',
    statusDetail: null,
    targetCount: 8234,
    date: '2026-06-26',
  },
  {
    id: 'notif-007',
    title: 'Tips Jualan Laris saat Ramadan',
    channel: 'app',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'pending_approval',
    statusLabel: 'Menunggu Persetujuan',
    statusDetail: 'di Admin Ops',
    targetCount: 5120,
    date: '2026-06-25',
  },
  {
    id: 'notif-008',
    title: 'Undangan Webinar Ekspor UMKM',
    channel: 'email',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'pending_approval',
    statusLabel: 'Menunggu Persetujuan',
    statusDetail: 'di Admin CMS',
    targetCount: 12300,
    date: '2026-10-24',
  },
  {
    id: 'notif-009',
    title: 'Ajakan Ikut Kelas Pembukuan',
    channel: 'app',
    submittedBy: null,
    subtitle: 'Belum diajukan, terakhir disimpan 23 Jun 2026',
    status: 'draft',
    statusLabel: 'Draf',
    statusDetail: null,
    targetCount: null,
    date: null,
  },
  {
    id: 'notif-010',
    title: 'Pengumuman Libur Layanan Akhir Pekan',
    channel: 'app',
    submittedBy: 'Adhitya Pratama',
    subtitle: 'Diajukan Adhitya Pratama',
    status: 'scheduled',
    statusLabel: 'Terjadwal',
    statusDetail: null,
    targetCount: 15000,
    date: '2026-06-22',
  },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mock-scenario, x-mock-response-code',
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(body));
}

function listNotifications(url) {
  const status = (url.searchParams.get('status') || 'all').toLowerCase();
  const channel = (url.searchParams.get('channel') || 'all').toLowerCase();
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10);

  let filtered = NOTIFICATIONS.slice();

  if (status && status !== 'all') {
    filtered = filtered.filter((item) => item.status === status);
  }

  if (channel && channel !== 'all') {
    filtered = filtered.filter((item) => item.channel === channel);
  }

  if (q) {
    filtered = filtered.filter((item) =>
      (item.title || '').toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    meta: { page, limit, total },
    counts: COUNTS,
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '', 'http://localhost');
  const pathname = url.pathname;

  if (req.method === 'OPTIONS' && pathname === '/api/notifications') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    return sendJson(res, 200, listNotifications(url));
  }

  sendJson(res, 404, { error: 'Endpoint not defined' });
});

server.listen(PORT);
