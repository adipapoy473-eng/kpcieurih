/**
 * Database Initialization & Seed Script
 * Website Desa Sukamaju
 *
 * Menjalankan: node database/init.js
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'desa.db');

// Hapus DB lama jika ada (fresh init)
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️  Database lama dihapus.');
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Membuat tabel database...\n');

// ============================================
// CREATE TABLES
// ============================================

db.exec(`
  -- Profil Desa
  CREATE TABLE profil_desa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_desa TEXT NOT NULL,
    kabupaten TEXT NOT NULL,
    kecamatan TEXT NOT NULL,
    provinsi TEXT NOT NULL,
    kode_pos TEXT,
    alamat TEXT,
    telepon TEXT,
    email TEXT,
    website TEXT,
    sejarah TEXT,
    visi TEXT,
    misi TEXT,
    potensi TEXT,
    jam_operasional TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Statistik Desa
  CREATE TABLE statistik (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunci TEXT NOT NULL UNIQUE,
    nilai TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT,
    suffix TEXT DEFAULT '',
    urutan INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Perangkat Desa
  CREATE TABLE perangkat_desa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    nip TEXT,
    periode TEXT,
    inisial TEXT,
    foto TEXT,
    urutan INTEGER DEFAULT 0,
    aktif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- BPD (Badan Permusyawaratan Desa)
  CREATE TABLE bpd (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jabatan TEXT NOT NULL,
    urutan INTEGER DEFAULT 0
  );

  -- Kategori Berita
  CREATE TABLE kategori_berita (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
  );

  -- Berita & Kegiatan
  CREATE TABLE berita (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    ringkasan TEXT,
    konten TEXT,
    gambar TEXT,
    kategori_id INTEGER,
    penulis TEXT DEFAULT 'Admin',
    dilihat INTEGER DEFAULT 0,
    dipublikasi INTEGER DEFAULT 1,
    tanggal DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori_berita(id)
  );

  -- Galeri Foto
  CREATE TABLE galeri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    gambar TEXT NOT NULL,
    kategori TEXT,
    urutan INTEGER DEFAULT 0,
    aktif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Layanan Publik
  CREATE TABLE layanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    icon TEXT,
    urutan INTEGER DEFAULT 0,
    aktif INTEGER DEFAULT 1
  );

  -- Persyaratan Layanan
  CREATE TABLE persyaratan_layanan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layanan_id INTEGER NOT NULL,
    persyaratan TEXT NOT NULL,
    urutan INTEGER DEFAULT 0,
    FOREIGN KEY (layanan_id) REFERENCES layanan(id) ON DELETE CASCADE
  );

  -- Pesan Kontak
  CREATE TABLE pesan_kontak (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    telepon TEXT,
    subjek TEXT,
    pesan TEXT NOT NULL,
    dibaca INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Admin Users
  CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nama_lengkap TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  -- Dusun
  CREATE TABLE dusun (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jumlah_rt INTEGER DEFAULT 0,
    jumlah_jiwa INTEGER DEFAULT 0,
    kepala_dusun TEXT,
    urutan INTEGER DEFAULT 0
  );

  -- Mata Pencaharian
  CREATE TABLE mata_pencaharian (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jenis TEXT NOT NULL,
    persentase REAL DEFAULT 0,
    urutan INTEGER DEFAULT 0
  );
`);

console.log('✅ Semua tabel berhasil dibuat.\n');

// ============================================
// SEED DATA
// ============================================

console.log('🌱 Mengisi data awal...\n');

// --- Profil Desa ---
db.prepare(`
  INSERT INTO profil_desa (nama_desa, kabupaten, kecamatan, provinsi, kode_pos, alamat, telepon, email, sejarah, visi, misi, potensi, jam_operasional)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Desa Sukamaju',
  'Kab. Sukabumi',
  'Kec. Cibadak',
  'Jawa Barat',
  '43351',
  'Jl. Raya Sukamaju No. 01, Kec. Cibadak, Kab. Sukabumi, Jawa Barat 43351',
  '(0266) 123-4567',
  'desa.sukamaju@gmail.com',
  'Desa Sukamaju didirikan pada tahun 1923 oleh sekelompok pemukim yang berasal dari wilayah Priangan. Nama "Sukamaju" berasal dari bahasa Sunda yang berarti "suka berkembang", mencerminkan semangat masyarakat untuk terus maju dan berkembang.\n\nPada masa kemerdekaan, Desa Sukamaju menjadi salah satu pusat kegiatan perjuangan di wilayah Sukabumi bagian selatan. Hingga saat ini, desa ini telah dipimpin oleh 12 kepala desa yang semuanya berkomitmen untuk memajukan kesejahteraan masyarakat.\n\nSeiring berjalannya waktu, Desa Sukamaju berkembang menjadi desa yang mandiri dengan berbagai potensi daerah, mulai dari sektor pertanian, perikanan, hingga pariwisata alam yang menjadi daya tarik tersendiri.',
  'Mewujudkan Desa Sukamaju yang Maju, Mandiri, Sejahtera, dan Berbudaya Berbasis Gotong Royong',
  '1. Meningkatkan kualitas pelayanan publik yang transparan, akuntabel, dan responsif.\n2. Membangun infrastruktur desa yang berkualitas dan merata di seluruh wilayah.\n3. Meningkatkan kualitas sumber daya manusia melalui pendidikan dan pelatihan.\n4. Mengembangkan potensi ekonomi lokal dan memberdayakan UMKM desa.\n5. Melestarikan budaya dan kearifan lokal sebagai identitas desa.\n6. Mewujudkan lingkungan yang bersih, hijau, dan berkelanjutan.',
  'Desa Sukamaju memiliki potensi unggulan di bidang pertanian padi organik, perkebunan teh, dan wisata alam. Terdapat juga beberapa UMKM yang bergerak di bidang kerajinan tangan bambu dan olahan makanan tradisional.',
  'Senin - Jumat: 08:00 - 16:00 WIB'
);
console.log('  ✓ Profil desa');

// --- Statistik ---
const insertStat = db.prepare('INSERT INTO statistik (kunci, nilai, label, icon, suffix, urutan) VALUES (?, ?, ?, ?, ?, ?)');
insertStat.run('jumlah_penduduk', '4582', 'Jumlah Penduduk', '👥', '', 1);
insertStat.run('kepala_keluarga', '1247', 'Kepala Keluarga', '🏠', '', 2);
insertStat.run('luas_wilayah', '856', 'Luas Wilayah', '🗺️', ' Ha', 3);
insertStat.run('rukun_tetangga', '12', 'Rukun Tetangga', '📍', ' RT', 4);
console.log('  ✓ Statistik desa');

// --- Perangkat Desa ---
const insertPerangkat = db.prepare('INSERT INTO perangkat_desa (nama, jabatan, nip, periode, inisial, urutan) VALUES (?, ?, ?, ?, ?, ?)');
insertPerangkat.run('H. Suherman, S.Sos', 'Kepala Desa', null, 'Periode 2024 - 2030', 'HS', 1);
insertPerangkat.run('Ahmad Supriatna, S.AP', 'Sekretaris Desa', 'NIP: 19780515 200601 1 012', null, 'AS', 2);
insertPerangkat.run('Siti Rahmawati, S.E', 'Kaur Keuangan', 'NIP: 19850320 201001 2 008', null, 'SR', 3);
insertPerangkat.run('Dedi Nurhadi', 'Kaur Umum & Perencanaan', 'NIP: 19820110 200901 1 005', null, 'DN', 4);
insertPerangkat.run('Erna Widiawati', 'Kasi Pemerintahan', 'NIP: 19900725 201301 2 003', null, 'EW', 5);
insertPerangkat.run('Ridwan Saputra', 'Kasi Kesejahteraan', 'NIP: 19880412 201501 1 007', null, 'RS', 6);
insertPerangkat.run('Irfan Fadillah', 'Kasi Pelayanan', 'NIP: 19920830 201601 1 004', null, 'IF', 7);
insertPerangkat.run('Yusuf Hidayat', 'Kadus Sukasari', 'Dusun 1', null, 'YH', 8);
insertPerangkat.run('Maya Rosmala', 'Kadus Sukamanah', 'Dusun 2', null, 'MR', 9);
insertPerangkat.run('Bambang Kurniawan', 'Kadus Sukasenang', 'Dusun 3', null, 'BK', 10);
console.log('  ✓ Perangkat desa');

// --- BPD ---
const insertBPD = db.prepare('INSERT INTO bpd (nama, jabatan, urutan) VALUES (?, ?, ?)');
insertBPD.run('H. Cecep Suryadi', 'Ketua', 1);
insertBPD.run('Neneng Hasanah', 'Wakil Ketua', 2);
insertBPD.run('Ujang Hermawan', 'Sekretaris', 3);
console.log('  ✓ BPD');

// --- Kategori Berita ---
const insertKategori = db.prepare('INSERT INTO kategori_berita (nama, slug) VALUES (?, ?)');
insertKategori.run('Kegiatan', 'kegiatan');
insertKategori.run('Pemerintahan', 'pemerintahan');
insertKategori.run('Pertanian', 'pertanian');
insertKategori.run('Kesehatan', 'kesehatan');
insertKategori.run('Pengumuman', 'pengumuman');
console.log('  ✓ Kategori berita');

// --- Berita ---
const insertBerita = db.prepare('INSERT INTO berita (judul, slug, ringkasan, konten, gambar, kategori_id, tanggal) VALUES (?, ?, ?, ?, ?, ?, ?)');
insertBerita.run(
  'Gotong Royong Bersih Desa Bersama Warga RT 05',
  'gotong-royong-bersih-desa-rt05',
  'Warga RT 05 Desa Sukamaju mengadakan kegiatan gotong royong membersihkan lingkungan desa dan penanaman pohon di sepanjang jalan utama desa.',
  'Warga RT 05 Desa Sukamaju mengadakan kegiatan gotong royong membersihkan lingkungan desa dan penanaman pohon di sepanjang jalan utama desa. Kegiatan ini diikuti oleh lebih dari 100 warga dari berbagai kalangan.\n\nKegiatan yang berlangsung dari pukul 07.00 hingga 12.00 WIB ini meliputi pembersihan selokan, pengecatan pagar, dan penanaman 50 bibit pohon di sepanjang jalan desa. Kepala Desa H. Suherman turut hadir dan memberikan apresiasi kepada seluruh warga yang berpartisipasi.',
  'assets/images/berita-gotong-royong.png', 1, '2026-03-28'
);
insertBerita.run(
  'Musyawarah Desa: Rencana Pembangunan Tahun 2026',
  'musyawarah-desa-rencana-pembangunan-2026',
  'Pemerintah Desa Sukamaju menggelar musyawarah desa untuk membahas rencana pembangunan infrastruktur dan program pemberdayaan masyarakat tahun anggaran 2026.',
  'Pemerintah Desa Sukamaju menggelar musyawarah desa untuk membahas rencana pembangunan infrastruktur dan program pemberdayaan masyarakat tahun anggaran 2026.\n\nMusyawarah yang dihadiri oleh seluruh perangkat desa, BPD, dan perwakilan tokoh masyarakat ini membahas beberapa agenda utama, di antaranya pembangunan jalan desa tahap II, renovasi balai desa, dan program bantuan modal UMKM.',
  'assets/images/berita-musyawarah.png', 2, '2026-03-25'
);
insertBerita.run(
  'Panen Raya: Hasil Pertanian Desa Meningkat 15%',
  'panen-raya-hasil-pertanian-meningkat',
  'Program intensifikasi pertanian berhasil meningkatkan hasil panen padi sebesar 15% dibanding musim tanam sebelumnya.',
  'Program intensifikasi pertanian berhasil meningkatkan hasil panen padi sebesar 15% dibanding musim tanam sebelumnya. Petani menyambut gembira hasil ini.\n\nKepala Desa mengapresiasi kerja keras para petani dan berharap program ini dapat terus dilanjutkan. Dinas Pertanian Kabupaten Sukabumi juga memberikan dukungan berupa bantuan bibit unggul dan pupuk organik.',
  'assets/images/berita-panen.png', 3, '2026-03-20'
);
insertBerita.run(
  'Posyandu Rutin: Pemeriksaan Kesehatan Ibu dan Anak',
  'posyandu-rutin-pemeriksaan-kesehatan',
  'Posyandu Desa Sukamaju mengadakan pemeriksaan kesehatan rutin bagi ibu hamil dan balita.',
  'Posyandu Desa Sukamaju mengadakan pemeriksaan kesehatan rutin bagi ibu hamil dan balita. Kegiatan ini dihadiri oleh bidan desa dan petugas kesehatan dari Puskesmas.\n\nTotal 45 balita dan 12 ibu hamil menjalani pemeriksaan. Selain pemeriksaan, petugas juga memberikan penyuluhan tentang gizi seimbang dan pentingnya imunisasi lengkap.',
  'assets/images/galeri-posyandu.png', 4, '2026-03-15'
);
insertBerita.run(
  'Peringatan Hari Besar Nasional di Balai Desa',
  'peringatan-hari-besar-nasional',
  'Pemerintah dan masyarakat Desa Sukamaju menggelar upacara peringatan hari besar nasional.',
  'Pemerintah dan masyarakat Desa Sukamaju menggelar upacara peringatan hari besar nasional yang dihadiri oleh seluruh elemen masyarakat desa.\n\nUpacara yang berlangsung khidmat ini diikuti oleh perangkat desa, guru, siswa, dan masyarakat umum. Acara dilanjutkan dengan perlombaan dan pentas seni budaya lokal.',
  'assets/images/galeri-upacara.png', 1, '2026-03-10'
);
insertBerita.run(
  'Pengumuman: Pembangunan Jalan Desa Tahap II Dimulai',
  'pengumuman-pembangunan-jalan-tahap-ii',
  'Pemerintah Desa Sukamaju mengumumkan dimulainya pembangunan jalan desa tahap II.',
  'Pemerintah Desa Sukamaju mengumumkan dimulainya pembangunan jalan desa tahap II yang menghubungkan Dusun Sukasari dan Dusun Sukamanah.\n\nPembangunan sepanjang 2,5 km ini dibiayai dari Dana Desa tahun 2026 dengan anggaran sebesar Rp 350 juta. Proyek ini diharapkan selesai dalam waktu 3 bulan dan akan meningkatkan konektivitas antar dusun.',
  'assets/images/galeri-infrastruktur.png', 5, '2026-03-05'
);
console.log('  ✓ Berita');

// --- Galeri ---
const insertGaleri = db.prepare('INSERT INTO galeri (judul, deskripsi, gambar, kategori, urutan) VALUES (?, ?, ?, ?, ?)');
insertGaleri.run('Panorama Desa Sukamaju', 'Pemandangan indah Desa Sukamaju dari ketinggian', 'assets/images/hero-desa.png', 'Lingkungan', 1);
insertGaleri.run('Kegiatan Gotong Royong', 'Warga bergotong royong membersihkan lingkungan desa', 'assets/images/berita-gotong-royong.png', 'Kegiatan', 2);
insertGaleri.run('Musyawarah Desa', 'Musyawarah desa membahas rencana pembangunan', 'assets/images/berita-musyawarah.png', 'Pemerintahan', 3);
insertGaleri.run('Panen Raya Petani Desa', 'Hasil panen padi petani Desa Sukamaju', 'assets/images/berita-panen.png', 'Pertanian', 4);
insertGaleri.run('Posyandu Desa', 'Kegiatan posyandu rutin di Desa Sukamaju', 'assets/images/galeri-posyandu.png', 'Kesehatan', 5);
insertGaleri.run('Upacara 17 Agustus', 'Peringatan HUT Kemerdekaan RI di Desa Sukamaju', 'assets/images/galeri-upacara.png', 'Kegiatan', 6);
insertGaleri.run('Pembangunan Infrastruktur', 'Pembangunan jalan desa tahap II', 'assets/images/galeri-infrastruktur.png', 'Pembangunan', 7);
insertGaleri.run('Area Persawahan', 'Hamparan sawah yang indah di Desa Sukamaju', 'assets/images/hero-desa.png', 'Lingkungan', 8);
insertGaleri.run('Kerja Bakti Warga', 'Warga gotong royong membersihkan fasilitas umum', 'assets/images/berita-gotong-royong.png', 'Kegiatan', 9);
console.log('  ✓ Galeri');

// --- Layanan ---
const insertLayanan = db.prepare('INSERT INTO layanan (nama, deskripsi, icon, urutan) VALUES (?, ?, ?, ?)');
const insertSyarat = db.prepare('INSERT INTO persyaratan_layanan (layanan_id, persyaratan, urutan) VALUES (?, ?, ?)');

let lid;

lid = insertLayanan.run('Surat Keterangan Umum', 'Surat keterangan untuk berbagai keperluan administratif seperti melamar pekerjaan, klaim asuransi, dll.', '📄', 1).lastInsertRowid;
insertSyarat.run(lid, 'Fotokopi KTP', 1);
insertSyarat.run(lid, 'Fotokopi Kartu Keluarga', 2);
insertSyarat.run(lid, 'Surat pengantar RT/RW', 3);
insertSyarat.run(lid, 'Pas foto 3x4 (2 lembar)', 4);

lid = insertLayanan.run('Surat Keterangan Domisili', 'Surat keterangan tempat tinggal untuk keperluan pekerjaan, pendidikan, dan administrasi resmi lainnya.', '🏡', 2).lastInsertRowid;
insertSyarat.run(lid, 'Fotokopi KTP', 1);
insertSyarat.run(lid, 'Fotokopi Kartu Keluarga', 2);
insertSyarat.run(lid, 'Surat pengantar RT/RW', 3);
insertSyarat.run(lid, 'Bukti tempat tinggal (kontrak/sertifikat)', 4);

lid = insertLayanan.run('Pengantar Kartu Keluarga', 'Surat pengantar untuk pembuatan baru, perubahan, atau penambahan anggota Kartu Keluarga di Disdukcapil.', '👨‍👩‍👧‍👦', 3).lastInsertRowid;
insertSyarat.run(lid, 'KK lama (untuk perubahan)', 1);
insertSyarat.run(lid, 'Fotokopi KTP seluruh anggota keluarga', 2);
insertSyarat.run(lid, 'Surat nikah / akta kelahiran', 3);
insertSyarat.run(lid, 'Surat pengantar RT/RW', 4);
insertSyarat.run(lid, 'Surat pindah (jika dari luar daerah)', 5);

lid = insertLayanan.run('Pengantar Akta Kelahiran', 'Surat pengantar pembuatan akta kelahiran untuk pendaftaran di Dinas Kependudukan dan Pencatatan Sipil.', '👶', 4).lastInsertRowid;
insertSyarat.run(lid, 'Surat keterangan lahir dari bidan/RS', 1);
insertSyarat.run(lid, 'Fotokopi KTP kedua orang tua', 2);
insertSyarat.run(lid, 'Fotokopi Kartu Keluarga', 3);
insertSyarat.run(lid, 'Fotokopi surat nikah', 4);
insertSyarat.run(lid, 'Surat pengantar RT/RW', 5);

lid = insertLayanan.run('Surat Keterangan Usaha', 'Surat keterangan usaha untuk keperluan perizinan, pengajuan kredit, dan pengembangan UMKM.', '🏪', 5).lastInsertRowid;
insertSyarat.run(lid, 'Fotokopi KTP pemilik usaha', 1);
insertSyarat.run(lid, 'Fotokopi Kartu Keluarga', 2);
insertSyarat.run(lid, 'Surat pengantar RT/RW', 3);
insertSyarat.run(lid, 'Foto lokasi usaha', 4);
insertSyarat.run(lid, 'Deskripsi jenis usaha', 5);

lid = insertLayanan.run('Surat Keterangan Tidak Mampu', 'Surat keterangan tidak mampu untuk keperluan beasiswa, keringanan biaya, dan bantuan sosial.', '📑', 6).lastInsertRowid;
insertSyarat.run(lid, 'Fotokopi KTP', 1);
insertSyarat.run(lid, 'Fotokopi Kartu Keluarga', 2);
insertSyarat.run(lid, 'Surat pengantar RT/RW', 3);
insertSyarat.run(lid, 'Foto rumah tampak depan', 4);

console.log('  ✓ Layanan publik + persyaratan');

// --- Dusun ---
const insertDusun = db.prepare('INSERT INTO dusun (nama, jumlah_rt, jumlah_jiwa, kepala_dusun, urutan) VALUES (?, ?, ?, ?, ?)');
insertDusun.run('Dusun 1 — Sukasari', 3, 1120, 'Yusuf Hidayat', 1);
insertDusun.run('Dusun 2 — Sukamanah', 3, 1215, 'Maya Rosmala', 2);
insertDusun.run('Dusun 3 — Sukasenang', 3, 1089, 'Bambang Kurniawan', 3);
insertDusun.run('Dusun 4 — Sukajaya', 3, 1158, null, 4);
console.log('  ✓ Dusun');

// --- Mata Pencaharian ---
const insertPekerjaan = db.prepare('INSERT INTO mata_pencaharian (jenis, persentase, urutan) VALUES (?, ?, ?)');
insertPekerjaan.run('Petani', 45, 1);
insertPekerjaan.run('Pedagang/Wiraswasta', 20, 2);
insertPekerjaan.run('Buruh', 15, 3);
insertPekerjaan.run('PNS/TNI/Polri', 8, 4);
insertPekerjaan.run('Lainnya', 12, 5);
console.log('  ✓ Mata pencaharian');

// --- Admin User ---
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO admin_users (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)').run(
  'admin', hashedPassword, 'Administrator Desa', 'admin'
);
console.log('  ✓ Admin user (username: admin, password: admin123)');

db.close();

console.log('\n🎉 Database berhasil diinisialisasi!');
console.log(`📁 Lokasi: ${DB_PATH}`);
console.log('\n🚀 Jalankan server dengan: npm start');
