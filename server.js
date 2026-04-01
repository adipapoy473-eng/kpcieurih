/**
 * Server Express - Website Desa Sukamaju
 * Melayani file statis + REST API + Admin Panel
 */

const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// ============================================
// DATABASE CONNECTION
// ============================================
const DB_PATH = path.join(__dirname, 'database', 'desa.db');
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database tidak ditemukan. Jalankan: npm run init-db');
  process.exit(1);
}
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'desa-sukamaju-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Static files
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  index: 'index.html'
}));

// Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'assets', 'images', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E6) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Hanya file gambar yang diizinkan'));
  }
});

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
}

// Helper: slug
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ============================================
// PUBLIC API ROUTES
// ============================================

// --- Profil Desa ---
app.get('/api/profil', (req, res) => {
  const profil = db.prepare('SELECT * FROM profil_desa LIMIT 1').get();
  const dusun = db.prepare('SELECT * FROM dusun ORDER BY urutan').all();
  const pekerjaan = db.prepare('SELECT * FROM mata_pencaharian ORDER BY urutan').all();
  res.json({ profil, dusun, pekerjaan });
});

// --- Statistik ---
app.get('/api/statistik', (req, res) => {
  const stats = db.prepare('SELECT * FROM statistik ORDER BY urutan').all();
  res.json(stats);
});

// --- Berita ---
app.get('/api/berita', (req, res) => {
  const { kategori, limit, page } = req.query;
  let sql = `SELECT b.*, k.nama as kategori_nama, k.slug as kategori_slug 
             FROM berita b LEFT JOIN kategori_berita k ON b.kategori_id = k.id
             WHERE b.dipublikasi = 1`;
  const params = [];

  if (kategori && kategori !== 'semua') {
    sql += ' AND k.slug = ?';
    params.push(kategori);
  }

  sql += ' ORDER BY b.tanggal DESC, b.id DESC';

  const pageSize = parseInt(limit) || 10;
  const pageNum = parseInt(page) || 1;
  const offset = (pageNum - 1) * pageSize;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const berita = db.prepare(sql).all(...params);

  // Count total
  let countSql = `SELECT COUNT(*) as total FROM berita b LEFT JOIN kategori_berita k ON b.kategori_id = k.id WHERE b.dipublikasi = 1`;
  const countParams = [];
  if (kategori && kategori !== 'semua') {
    countSql += ' AND k.slug = ?';
    countParams.push(kategori);
  }
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({ berita, total, page: pageNum, pageSize, totalPages: Math.ceil(total / pageSize) });
});

app.get('/api/berita/:id', (req, res) => {
  const berita = db.prepare(`
    SELECT b.*, k.nama as kategori_nama, k.slug as kategori_slug 
    FROM berita b LEFT JOIN kategori_berita k ON b.kategori_id = k.id 
    WHERE b.id = ?
  `).get(req.params.id);
  if (!berita) return res.status(404).json({ error: 'Berita tidak ditemukan' });

  // Increment view count
  db.prepare('UPDATE berita SET dilihat = dilihat + 1 WHERE id = ?').run(req.params.id);
  berita.dilihat += 1;

  res.json(berita);
});

app.get('/api/kategori-berita', (req, res) => {
  const kategori = db.prepare('SELECT * FROM kategori_berita ORDER BY id').all();
  res.json(kategori);
});

// --- Galeri ---
app.get('/api/galeri', (req, res) => {
  const galeri = db.prepare('SELECT * FROM galeri WHERE aktif = 1 ORDER BY urutan, id DESC').all();
  res.json(galeri);
});

// --- Layanan ---
app.get('/api/layanan', (req, res) => {
  const layanan = db.prepare('SELECT * FROM layanan WHERE aktif = 1 ORDER BY urutan').all();
  layanan.forEach(l => {
    l.persyaratan = db.prepare('SELECT * FROM persyaratan_layanan WHERE layanan_id = ? ORDER BY urutan').all(l.id);
  });
  res.json(layanan);
});

// --- Perangkat Desa ---
app.get('/api/perangkat', (req, res) => {
  const perangkat = db.prepare('SELECT * FROM perangkat_desa WHERE aktif = 1 ORDER BY urutan').all();
  const bpd = db.prepare('SELECT * FROM bpd ORDER BY urutan').all();
  res.json({ perangkat, bpd });
});

// --- Kontak (Public POST) ---
app.post('/api/kontak', (req, res) => {
  const { nama, email, telepon, subjek, pesan } = req.body;
  if (!nama || !email || !pesan) {
    return res.status(400).json({ error: 'Nama, email, dan pesan wajib diisi.' });
  }
  try {
    db.prepare('INSERT INTO pesan_kontak (nama, email, telepon, subjek, pesan) VALUES (?, ?, ?, ?, ?)')
      .run(nama, email, telepon || null, subjek || null, pesan);
    res.json({ success: true, message: 'Pesan berhasil dikirim!' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengirim pesan.' });
  }
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // Update last_login
  db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  req.session.admin = { id: user.id, username: user.username, nama: user.nama_lengkap, role: user.role };
  res.json({ success: true, admin: req.session.admin });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.admin) {
    res.json({ authenticated: true, admin: req.session.admin });
  } else {
    res.json({ authenticated: false });
  }
});

// ============================================
// ADMIN API ROUTES (Protected)
// ============================================

// --- Dashboard Stats ---
app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  const totalBerita = db.prepare('SELECT COUNT(*) as c FROM berita').get().c;
  const totalGaleri = db.prepare('SELECT COUNT(*) as c FROM galeri WHERE aktif = 1').get().c;
  const totalPesan = db.prepare('SELECT COUNT(*) as c FROM pesan_kontak').get().c;
  const pesanBelumDibaca = db.prepare('SELECT COUNT(*) as c FROM pesan_kontak WHERE dibaca = 0').get().c;
  const totalPerangkat = db.prepare('SELECT COUNT(*) as c FROM perangkat_desa WHERE aktif = 1').get().c;
  const totalLayanan = db.prepare('SELECT COUNT(*) as c FROM layanan WHERE aktif = 1').get().c;
  res.json({ totalBerita, totalGaleri, totalPesan, pesanBelumDibaca, totalPerangkat, totalLayanan });
});

// --- CRUD Berita (Admin) ---
app.get('/api/admin/berita', requireAuth, (req, res) => {
  const berita = db.prepare(`
    SELECT b.*, k.nama as kategori_nama FROM berita b 
    LEFT JOIN kategori_berita k ON b.kategori_id = k.id 
    ORDER BY b.tanggal DESC, b.id DESC
  `).all();
  res.json(berita);
});

app.post('/api/admin/berita', requireAuth, upload.single('gambar'), (req, res) => {
  const { judul, ringkasan, konten, kategori_id, tanggal, dipublikasi } = req.body;
  if (!judul || !tanggal) return res.status(400).json({ error: 'Judul dan tanggal wajib diisi.' });
  
  const slug = slugify(judul) + '-' + Date.now();
  const gambar = req.file ? 'assets/images/uploads/' + req.file.filename : (req.body.gambar_url || null);

  const result = db.prepare(`
    INSERT INTO berita (judul, slug, ringkasan, konten, gambar, kategori_id, tanggal, dipublikasi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(judul, slug, ringkasan || null, konten || null, gambar, kategori_id || null, tanggal, dipublikasi === '0' ? 0 : 1);

  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/admin/berita/:id', requireAuth, upload.single('gambar'), (req, res) => {
  const { judul, ringkasan, konten, kategori_id, tanggal, dipublikasi } = req.body;
  if (!judul || !tanggal) return res.status(400).json({ error: 'Judul dan tanggal wajib diisi.' });

  let gambar = req.body.gambar_existing || null;
  if (req.file) gambar = 'assets/images/uploads/' + req.file.filename;

  db.prepare(`
    UPDATE berita SET judul=?, ringkasan=?, konten=?, gambar=?, kategori_id=?, tanggal=?, dipublikasi=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(judul, ringkasan || null, konten || null, gambar, kategori_id || null, tanggal, dipublikasi === '0' ? 0 : 1, req.params.id);

  res.json({ success: true });
});

app.delete('/api/admin/berita/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM berita WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- CRUD Galeri (Admin) ---
app.get('/api/admin/galeri', requireAuth, (req, res) => {
  const galeri = db.prepare('SELECT * FROM galeri ORDER BY urutan, id DESC').all();
  res.json(galeri);
});

app.post('/api/admin/galeri', requireAuth, upload.single('gambar'), (req, res) => {
  const { judul, deskripsi, kategori } = req.body;
  if (!judul) return res.status(400).json({ error: 'Judul wajib diisi.' });
  if (!req.file) return res.status(400).json({ error: 'Gambar wajib diupload.' });

  const gambar = 'assets/images/uploads/' + req.file.filename;
  const maxUrutan = db.prepare('SELECT MAX(urutan) as m FROM galeri').get().m || 0;

  const result = db.prepare('INSERT INTO galeri (judul, deskripsi, gambar, kategori, urutan) VALUES (?, ?, ?, ?, ?)')
    .run(judul, deskripsi || null, gambar, kategori || null, maxUrutan + 1);

  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete('/api/admin/galeri/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM galeri WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- Pesan Kontak (Admin) ---
app.get('/api/admin/pesan', requireAuth, (req, res) => {
  const pesan = db.prepare('SELECT * FROM pesan_kontak ORDER BY created_at DESC').all();
  res.json(pesan);
});

app.put('/api/admin/pesan/:id/baca', requireAuth, (req, res) => {
  db.prepare('UPDATE pesan_kontak SET dibaca = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/pesan/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM pesan_kontak WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- Statistik (Admin Update) ---
app.put('/api/admin/statistik/:id', requireAuth, (req, res) => {
  const { nilai } = req.body;
  db.prepare('UPDATE statistik SET nilai = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nilai, req.params.id);
  res.json({ success: true });
});

// --- Perangkat Desa (Admin) ---
app.post('/api/admin/perangkat', requireAuth, (req, res) => {
  const { nama, jabatan, nip, periode, inisial } = req.body;
  if (!nama || !jabatan) return res.status(400).json({ error: 'Nama dan jabatan wajib diisi.' });
  const maxUrutan = db.prepare('SELECT MAX(urutan) as m FROM perangkat_desa').get().m || 0;
  const result = db.prepare('INSERT INTO perangkat_desa (nama, jabatan, nip, periode, inisial, urutan) VALUES (?, ?, ?, ?, ?, ?)')
    .run(nama, jabatan, nip || null, periode || null, inisial || nama.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(), maxUrutan + 1);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/admin/perangkat/:id', requireAuth, (req, res) => {
  const { nama, jabatan, nip, periode, inisial } = req.body;
  db.prepare('UPDATE perangkat_desa SET nama=?, jabatan=?, nip=?, periode=?, inisial=? WHERE id=?')
    .run(nama, jabatan, nip || null, periode || null, inisial || null, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/perangkat/:id', requireAuth, (req, res) => {
  db.prepare('UPDATE perangkat_desa SET aktif = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- Profil (Admin Update) ---
app.put('/api/admin/profil', requireAuth, (req, res) => {
  const { nama_desa, alamat, telepon, email, sejarah, visi, misi, potensi, jam_operasional } = req.body;
  db.prepare(`
    UPDATE profil_desa SET nama_desa=?, alamat=?, telepon=?, email=?, sejarah=?, visi=?, misi=?, potensi=?, jam_operasional=?, updated_at=CURRENT_TIMESTAMP WHERE id=1
  `).run(nama_desa, alamat, telepon, email, sejarah, visi, misi, potensi, jam_operasional);
  res.json({ success: true });
});

// ============================================
// FALLBACK - Serve HTML pages
// ============================================
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   🏠 Website Desa Sukamaju - Server Ready   ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   🌐 http://localhost:${PORT}                 ║`);
  console.log(`  ║   🔧 Admin: http://localhost:${PORT}/admin     ║`);
  console.log('  ║   📋 API:   /api/*                           ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit();
});
