# Database Backend untuk Website Desa Sukamaju

## Latar Belakang
Website Desa Sukamaju saat ini adalah website statis (HTML/CSS/JS) yang dilayani oleh server PowerShell sederhana. Semua data di-hardcode langsung di file HTML. Dengan menambahkan database, konten website bisa dikelola secara dinamis melalui admin panel.

## Teknologi yang Digunakan

| Komponen | Teknologi | Alasan |
|----------|-----------|--------|
| Backend | **Node.js + Express** | Ringan, cepat, ecosystem luas |
| Database | **SQLite** (via `better-sqlite3`) | Tidak perlu install database server terpisah, file-based, mudah backup |
| ORM | Langsung SQL | Lebih transparan untuk project sederhana |
| Auth | **bcryptjs + express-session** | Untuk proteksi admin panel |

## User Review Required

> [!IMPORTANT]
> Perubahan ini akan menggantikan server PowerShell (`server.ps1`) dengan server Node.js Express yang juga melayani file statis + API endpoints.

> [!WARNING]
> Dibutuhkan **Node.js** terinstal di sistem. Pastikan Node.js sudah tersedia sebelum menjalankan server baru.

## Proposed Changes

### 1. Database Schema

#### [NEW] database/schema.sql

Tabel-tabel yang akan dibuat:

```sql
-- Informasi profil desa
CREATE TABLE profil_desa (...)

-- Statistik desa (jumlah penduduk, KK, luas wilayah, dll)
CREATE TABLE statistik (...)

-- Perangkat desa / pemerintahan
CREATE TABLE perangkat_desa (...)

-- Berita & kegiatan
CREATE TABLE berita (...)

-- Galeri foto
CREATE TABLE galeri (...)

-- Layanan publik + persyaratan
CREATE TABLE layanan (...)
CREATE TABLE persyaratan_layanan (...)

-- Pesan kontak dari pengunjung website
CREATE TABLE pesan_kontak (...)

-- Admin users
CREATE TABLE admin_users (...)
```

---

### 2. Backend Server

#### [NEW] server.js
- Express server menggantikan `server.ps1`
- Melayani file statis (HTML, CSS, JS, images)
- REST API endpoints

#### [NEW] package.json
- Dependencies: `express`, `better-sqlite3`, `bcryptjs`, `express-session`, `multer` (upload gambar)

#### [NEW] database/init.js
- Script untuk membuat tabel dan seed data awal dari konten website yang sudah ada

---

### 3. REST API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/berita` | Daftar semua berita (filter by kategori) |
| GET | `/api/berita/:id` | Detail berita |
| POST | `/api/berita` | Tambah berita (admin) |
| PUT | `/api/berita/:id` | Edit berita (admin) |
| DELETE | `/api/berita/:id` | Hapus berita (admin) |
| GET | `/api/galeri` | Daftar semua galeri |
| POST | `/api/galeri` | Tambah foto (admin) |
| DELETE | `/api/galeri/:id` | Hapus foto (admin) |
| GET | `/api/layanan` | Daftar layanan + persyaratan |
| GET | `/api/perangkat` | Daftar perangkat desa |
| GET | `/api/statistik` | Statistik desa |
| GET | `/api/profil` | Profil desa |
| POST | `/api/kontak` | Kirim pesan kontak |
| GET | `/api/kontak` | Daftar pesan (admin) |
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout admin |

---

### 4. Admin Panel

#### [NEW] admin.html
- Halaman dashboard admin dengan fitur CRUD
- Login/logout
- Kelola berita, galeri, layanan, perangkat desa, statistik
- Lihat pesan kontak masuk

#### [NEW] css/admin.css
- Styling khusus admin panel

#### [NEW] js/admin.js
- Logic frontend admin panel

---

### 5. Update Frontend

#### [MODIFY] js/main.js
- Contact form sekarang mengirim data ke `/api/kontak`
- Berita, galeri, statistik dimuat dari API (progressive enhancement)

---

## Struktur File Baru

```
desa/
├── database/
│   ├── init.js          # Inisialisasi DB + seed data
│   └── desa.db          # File database SQLite (auto-generated)
├── server.js            # Express server (menggantikan server.ps1)
├── package.json         # Dependencies
├── admin.html           # Admin panel
├── css/admin.css        # Admin styles
├── js/admin.js          # Admin logic
└── ... (file existing tetap sama)
```

## Open Questions

> [!IMPORTANT]
> 1. Apakah Anda ingin **admin panel** untuk mengelola konten, atau cukup database + API saja?
> 2. Apakah ada fitur tambahan yang ingin ditambahkan selain yang sudah ada di website?
> 3. Username dan password default admin apa yang diinginkan? (default: `admin` / `admin123`)

## Verification Plan

### Automated Tests
- Jalankan `npm start` dan verifikasi server berjalan
- Test semua API endpoint via browser
- Verifikasi data seed sesuai dengan konten website yang sudah ada

### Manual Verification
- Buka website di browser dan pastikan semua halaman tetap berfungsi
- Test admin panel: login, CRUD berita, galeri
- Test form kontak mengirim data ke database
