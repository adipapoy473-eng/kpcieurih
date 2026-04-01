/**
 * Admin Panel JavaScript - Website Desa Sukamaju
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginScreen = document.getElementById('loginScreen');
  const adminWrapper = document.getElementById('adminWrapper');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const pageTitle = document.getElementById('pageTitle');
  const adminName = document.getElementById('adminName');
  const modalOverlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  // ============================================
  // AUTH
  // ============================================

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        showDashboard(data.admin);
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    adminWrapper.style.display = 'none';
  }

  function showDashboard(admin) {
    loginScreen.style.display = 'none';
    adminWrapper.style.display = 'flex';
    adminName.textContent = admin.nama || admin.username;
    loadDashboard();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        showDashboard(data.admin);
      } else {
        loginError.textContent = data.error || 'Login gagal.';
      }
    } catch {
      loginError.textContent = 'Terjadi kesalahan koneksi.';
    }
  });

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    showLogin();
  });

  // ============================================
  // NAVIGATION
  // ============================================

  const sectionNames = {
    dashboard: '📊 Dashboard',
    berita: '📰 Kelola Berita',
    galeri: '🖼️ Kelola Galeri',
    perangkat: '👥 Perangkat Desa',
    layanan: '📋 Layanan Publik',
    pesan: '💬 Pesan Masuk',
    statistik: '📈 Statistik Desa',
    profil: '🏠 Profil Desa'
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (!section) return;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('#contentArea .section').forEach(s => s.classList.remove('active'));
      document.getElementById('sec-' + section)?.classList.add('active');

      pageTitle.textContent = sectionNames[section] || section;

      // Load section data
      switch (section) {
        case 'dashboard': loadDashboard(); break;
        case 'berita': loadBerita(); break;
        case 'galeri': loadGaleri(); break;
        case 'perangkat': loadPerangkat(); break;
        case 'layanan': loadLayanan(); break;
        case 'pesan': loadPesan(); break;
        case 'statistik': loadStatistik(); break;
        case 'profil': loadProfil(); break;
      }

      // Close sidebar on mobile
      sidebar.classList.remove('active');
    });
  });

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // ============================================
  // MODAL
  // ============================================

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ============================================
  // TOAST
  // ============================================

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async function loadDashboard() {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      document.getElementById('dashboardStats').innerHTML = `
        <div class="stat-box"><div class="stat-value">${data.totalBerita}</div><div class="stat-label">📰 Total Berita</div></div>
        <div class="stat-box"><div class="stat-value">${data.totalGaleri}</div><div class="stat-label">🖼️ Foto Galeri</div></div>
        <div class="stat-box"><div class="stat-value">${data.totalPesan}</div><div class="stat-label">💬 Pesan Masuk</div></div>
        <div class="stat-box"><div class="stat-value">${data.pesanBelumDibaca}</div><div class="stat-label">📩 Belum Dibaca</div></div>
        <div class="stat-box"><div class="stat-value">${data.totalPerangkat}</div><div class="stat-label">👥 Perangkat Desa</div></div>
        <div class="stat-box"><div class="stat-value">${data.totalLayanan}</div><div class="stat-label">📋 Layanan</div></div>
      `;
      // Update badge
      const badge = document.getElementById('pesanBadge');
      if (data.pesanBelumDibaca > 0) {
        badge.textContent = data.pesanBelumDibaca;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    } catch {
      showToast('Gagal memuat dashboard', 'error');
    }
  }

  // ============================================
  // BERITA
  // ============================================

  let kategoriList = [];

  async function loadKategori() {
    const res = await fetch('/api/kategori-berita');
    kategoriList = await res.json();
  }

  async function loadBerita() {
    await loadKategori();
    try {
      const res = await fetch('/api/admin/berita');
      const berita = await res.json();
      const tbody = document.querySelector('#tabelBerita tbody');
      tbody.innerHTML = berita.map((b, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="max-width:250px;font-weight:500">${escHtml(b.judul)}</td>
          <td>${b.kategori_nama || '-'}</td>
          <td style="white-space:nowrap">${formatDate(b.tanggal)}</td>
          <td>${b.dipublikasi ? '<span class="status-badge status-published">Publik</span>' : '<span class="status-badge status-draft">Draft</span>'}</td>
          <td>${b.dilihat}</td>
          <td><div class="btn-actions">
            <button class="btn-sm btn-edit" onclick="editBerita(${b.id})">Edit</button>
            <button class="btn-sm btn-delete" onclick="hapusBerita(${b.id})">Hapus</button>
          </div></td>
        </tr>
      `).join('');
    } catch {
      showToast('Gagal memuat berita', 'error');
    }
  }

  function beritaFormHtml(berita = null) {
    const kategoriOptions = kategoriList.map(k => 
      `<option value="${k.id}" ${berita && berita.kategori_id == k.id ? 'selected' : ''}>${k.nama}</option>`
    ).join('');
    return `
      <form id="formBerita" enctype="multipart/form-data">
        <div class="form-group"><label>Judul *</label><input type="text" class="form-control" name="judul" value="${berita ? escAttr(berita.judul) : ''}" required></div>
        <div class="form-row">
          <div class="form-group"><label>Kategori</label><select class="form-control" name="kategori_id"><option value="">Pilih Kategori</option>${kategoriOptions}</select></div>
          <div class="form-group"><label>Tanggal *</label><input type="date" class="form-control" name="tanggal" value="${berita ? berita.tanggal : new Date().toISOString().slice(0, 10)}" required></div>
        </div>
        <div class="form-group"><label>Ringkasan</label><textarea class="form-control" name="ringkasan" rows="2">${berita ? escHtml(berita.ringkasan || '') : ''}</textarea></div>
        <div class="form-group"><label>Konten</label><textarea class="form-control" name="konten" rows="5">${berita ? escHtml(berita.konten || '') : ''}</textarea></div>
        <div class="form-group"><label>Gambar</label><input type="file" class="form-control" name="gambar" accept="image/*"></div>
        ${berita && berita.gambar ? `<div class="form-group"><img src="${berita.gambar}" style="max-height:100px;border-radius:8px"><input type="hidden" name="gambar_existing" value="${berita.gambar}"></div>` : ''}
        <div class="form-group"><label><input type="checkbox" name="dipublikasi" value="1" ${!berita || berita.dipublikasi ? 'checked' : ''}> Publikasikan</label></div>
        <button type="submit" class="btn-primary">💾 ${berita ? 'Simpan Perubahan' : 'Tambah Berita'}</button>
      </form>
    `;
  }

  document.getElementById('btnTambahBerita').addEventListener('click', async () => {
    await loadKategori();
    openModal('Tambah Berita Baru', beritaFormHtml());
    document.getElementById('formBerita').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      if (!form.querySelector('[name=dipublikasi]').checked) fd.set('dipublikasi', '0');
      try {
        const res = await fetch('/api/admin/berita', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) { showToast('Berita berhasil ditambahkan!'); closeModal(); loadBerita(); }
        else showToast(data.error || 'Gagal', 'error');
      } catch { showToast('Gagal menambah berita', 'error'); }
    });
  });

  window.editBerita = async (id) => {
    await loadKategori();
    const res = await fetch(`/api/berita/${id}`);
    const berita = await res.json();
    openModal('Edit Berita', beritaFormHtml(berita));
    document.getElementById('formBerita').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      if (!form.querySelector('[name=dipublikasi]').checked) fd.set('dipublikasi', '0');
      try {
        const res = await fetch(`/api/admin/berita/${id}`, { method: 'PUT', body: fd });
        const data = await res.json();
        if (data.success) { showToast('Berita berhasil diperbarui!'); closeModal(); loadBerita(); }
        else showToast(data.error || 'Gagal', 'error');
      } catch { showToast('Gagal memperbarui berita', 'error'); }
    });
  };

  window.hapusBerita = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;
    try {
      const res = await fetch(`/api/admin/berita/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Berita berhasil dihapus!'); loadBerita(); }
    } catch { showToast('Gagal menghapus berita', 'error'); }
  };

  // ============================================
  // GALERI
  // ============================================

  async function loadGaleri() {
    try {
      const res = await fetch('/api/admin/galeri');
      const galeri = await res.json();
      document.getElementById('galeriGrid').innerHTML = galeri.map(g => `
        <div class="galeri-item">
          <img src="${g.gambar}" alt="${escAttr(g.judul)}" loading="lazy">
          <div class="galeri-item-info">
            <h4>${escHtml(g.judul)}</h4>
            <p>${g.kategori || ''}</p>
          </div>
          <div class="galeri-item-actions">
            <button class="btn-sm btn-delete" onclick="hapusGaleri(${g.id})">🗑️ Hapus</button>
          </div>
        </div>
      `).join('');
    } catch { showToast('Gagal memuat galeri', 'error'); }
  }

  document.getElementById('btnTambahGaleri').addEventListener('click', () => {
    openModal('Tambah Foto Galeri', `
      <form id="formGaleri" enctype="multipart/form-data">
        <div class="form-group"><label>Judul *</label><input type="text" class="form-control" name="judul" required></div>
        <div class="form-group"><label>Deskripsi</label><textarea class="form-control" name="deskripsi" rows="2"></textarea></div>
        <div class="form-group"><label>Kategori</label><input type="text" class="form-control" name="kategori" placeholder="cth: Kegiatan, Lingkungan"></div>
        <div class="form-group"><label>Gambar *</label><input type="file" class="form-control" name="gambar" accept="image/*" required></div>
        <button type="submit" class="btn-primary">💾 Upload Foto</button>
      </form>
    `);
    document.getElementById('formGaleri').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await fetch('/api/admin/galeri', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) { showToast('Foto berhasil ditambahkan!'); closeModal(); loadGaleri(); }
        else showToast(data.error || 'Gagal', 'error');
      } catch { showToast('Gagal upload foto', 'error'); }
    });
  });

  window.hapusGaleri = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    try {
      const res = await fetch(`/api/admin/galeri/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Foto berhasil dihapus!'); loadGaleri(); }
    } catch { showToast('Gagal menghapus foto', 'error'); }
  };

  // ============================================
  // PERANGKAT DESA
  // ============================================

  async function loadPerangkat() {
    try {
      const res = await fetch('/api/perangkat');
      const { perangkat } = await res.json();
      const tbody = document.querySelector('#tabelPerangkat tbody');
      tbody.innerHTML = perangkat.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight:500">${escHtml(p.nama)}</td>
          <td>${escHtml(p.jabatan)}</td>
          <td>${p.nip || p.periode || '-'}</td>
          <td><div class="btn-actions">
            <button class="btn-sm btn-edit" onclick="editPerangkat(${p.id}, '${escAttr(p.nama)}', '${escAttr(p.jabatan)}', '${escAttr(p.nip || '')}', '${escAttr(p.periode || '')}', '${escAttr(p.inisial || '')}')">Edit</button>
            <button class="btn-sm btn-delete" onclick="hapusPerangkat(${p.id})">Hapus</button>
          </div></td>
        </tr>
      `).join('');
    } catch { showToast('Gagal memuat perangkat', 'error'); }
  }

  function perangkatFormHtml(p = null) {
    return `
      <form id="formPerangkat">
        <div class="form-group"><label>Nama Lengkap *</label><input type="text" class="form-control" name="nama" value="${p ? escAttr(p.nama) : ''}" required></div>
        <div class="form-group"><label>Jabatan *</label><input type="text" class="form-control" name="jabatan" value="${p ? escAttr(p.jabatan) : ''}" required></div>
        <div class="form-row">
          <div class="form-group"><label>NIP</label><input type="text" class="form-control" name="nip" value="${p ? escAttr(p.nip) : ''}"></div>
          <div class="form-group"><label>Inisial</label><input type="text" class="form-control" name="inisial" value="${p ? escAttr(p.inisial) : ''}" maxlength="3"></div>
        </div>
        <div class="form-group"><label>Periode</label><input type="text" class="form-control" name="periode" value="${p ? escAttr(p.periode) : ''}"></div>
        <button type="submit" class="btn-primary">💾 ${p ? 'Simpan' : 'Tambah'}</button>
      </form>
    `;
  }

  document.getElementById('btnTambahPerangkat').addEventListener('click', () => {
    openModal('Tambah Perangkat Desa', perangkatFormHtml());
    document.getElementById('formPerangkat').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        const res = await fetch('/api/admin/perangkat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd)
        });
        const data = await res.json();
        if (data.success) { showToast('Perangkat berhasil ditambahkan!'); closeModal(); loadPerangkat(); }
        else showToast(data.error || 'Gagal', 'error');
      } catch { showToast('Gagal menambah perangkat', 'error'); }
    });
  });

  window.editPerangkat = (id, nama, jabatan, nip, periode, inisial) => {
    openModal('Edit Perangkat', perangkatFormHtml({ nama, jabatan, nip, periode, inisial }));
    document.getElementById('formPerangkat').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        const res = await fetch(`/api/admin/perangkat/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd)
        });
        const data = await res.json();
        if (data.success) { showToast('Perangkat berhasil diperbarui!'); closeModal(); loadPerangkat(); }
        else showToast(data.error || 'Gagal', 'error');
      } catch { showToast('Gagal memperbarui perangkat', 'error'); }
    });
  };

  window.hapusPerangkat = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini?')) return;
    try {
      const res = await fetch(`/api/admin/perangkat/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Perangkat berhasil dihapus!'); loadPerangkat(); }
    } catch { showToast('Gagal menghapus perangkat', 'error'); }
  };

  // ============================================
  // LAYANAN
  // ============================================

  async function loadLayanan() {
    try {
      const res = await fetch('/api/layanan');
      const layanan = await res.json();
      const tbody = document.querySelector('#tabelLayanan tbody');
      tbody.innerHTML = layanan.map((l, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-size:1.5rem">${l.icon}</td>
          <td style="font-weight:500">${escHtml(l.nama)}</td>
          <td style="max-width:200px;font-size:.85rem;color:#64748B">${escHtml(l.deskripsi || '')}</td>
          <td><ul style="margin:0;padding-left:1.2rem;font-size:.8rem">${l.persyaratan.map(p => `<li>${escHtml(p.persyaratan)}</li>`).join('')}</ul></td>
        </tr>
      `).join('');
    } catch { showToast('Gagal memuat layanan', 'error'); }
  }

  // ============================================
  // PESAN
  // ============================================

  async function loadPesan() {
    try {
      const res = await fetch('/api/admin/pesan');
      const pesan = await res.json();
      const tbody = document.querySelector('#tabelPesan tbody');
      tbody.innerHTML = pesan.length === 0 
        ? '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:2rem">Belum ada pesan masuk</td></tr>'
        : pesan.map((p, i) => `
        <tr style="${!p.dibaca ? 'font-weight:600;background:#F0F9FF' : ''}">
          <td>${i + 1}</td>
          <td>${escHtml(p.nama)}</td>
          <td style="font-size:.85rem">${escHtml(p.email)}</td>
          <td>${p.subjek || '-'}</td>
          <td style="white-space:nowrap;font-size:.85rem">${formatDateTime(p.created_at)}</td>
          <td>${p.dibaca ? '<span class="status-badge status-read">Dibaca</span>' : '<span class="status-badge status-unread">Baru</span>'}</td>
          <td><div class="btn-actions">
            <button class="btn-sm btn-view" onclick="lihatPesan(${p.id})">Lihat</button>
            <button class="btn-sm btn-delete" onclick="hapusPesan(${p.id})">Hapus</button>
          </div></td>
        </tr>
      `).join('');
    } catch { showToast('Gagal memuat pesan', 'error'); }
  }

  window.lihatPesan = async (id) => {
    try {
      const res = await fetch('/api/admin/pesan');
      const pesan = (await res.json()).find(p => p.id === id);
      if (!pesan) return;

      // Mark as read
      await fetch(`/api/admin/pesan/${id}/baca`, { method: 'PUT' });

      openModal('Detail Pesan', `
        <div class="pesan-detail">
          <div class="pesan-meta">
            <strong>Nama:</strong> <span>${escHtml(pesan.nama)}</span>
            <strong>Email:</strong> <span>${escHtml(pesan.email)}</span>
            <strong>Telepon:</strong> <span>${pesan.telepon || '-'}</span>
            <strong>Subjek:</strong> <span>${pesan.subjek || '-'}</span>
            <strong>Tanggal:</strong> <span>${formatDateTime(pesan.created_at)}</span>
          </div>
          <div class="pesan-isi">${escHtml(pesan.pesan)}</div>
        </div>
      `);
      loadPesan();
      loadDashboard();
    } catch { showToast('Gagal memuat pesan', 'error'); }
  };

  window.hapusPesan = async (id) => {
    if (!confirm('Hapus pesan ini?')) return;
    try {
      await fetch(`/api/admin/pesan/${id}`, { method: 'DELETE' });
      showToast('Pesan dihapus'); loadPesan(); loadDashboard();
    } catch { showToast('Gagal menghapus', 'error'); }
  };

  // ============================================
  // STATISTIK
  // ============================================

  async function loadStatistik() {
    try {
      const res = await fetch('/api/statistik');
      const stats = await res.json();
      document.getElementById('statistikGrid').innerHTML = stats.map(s => `
        <div class="statistik-card">
          <div class="stat-icon-lg">${s.icon}</div>
          <h4>${escHtml(s.label)}${s.suffix ? ' (' + s.suffix.trim() + ')' : ''}</h4>
          <div class="stat-form">
            <input type="text" id="stat-${s.id}" value="${s.nilai}">
            <button onclick="updateStat(${s.id})">💾</button>
          </div>
        </div>
      `).join('');
    } catch { showToast('Gagal memuat statistik', 'error'); }
  }

  window.updateStat = async (id) => {
    const input = document.getElementById('stat-' + id);
    try {
      const res = await fetch(`/api/admin/statistik/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nilai: input.value })
      });
      const data = await res.json();
      if (data.success) showToast('Statistik berhasil diperbarui!');
    } catch { showToast('Gagal memperbarui', 'error'); }
  };

  // ============================================
  // PROFIL DESA
  // ============================================

  async function loadProfil() {
    try {
      const res = await fetch('/api/profil');
      const { profil } = await res.json();
      document.getElementById('profilNama').value = profil.nama_desa || '';
      document.getElementById('profilTelepon').value = profil.telepon || '';
      document.getElementById('profilEmail').value = profil.email || '';
      document.getElementById('profilJam').value = profil.jam_operasional || '';
      document.getElementById('profilAlamat').value = profil.alamat || '';
      document.getElementById('profilSejarah').value = profil.sejarah || '';
      document.getElementById('profilVisi').value = profil.visi || '';
      document.getElementById('profilMisi').value = profil.misi || '';
      document.getElementById('profilPotensi').value = profil.potensi || '';
    } catch { showToast('Gagal memuat profil', 'error'); }
  }

  document.getElementById('formProfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nama_desa: document.getElementById('profilNama').value,
      telepon: document.getElementById('profilTelepon').value,
      email: document.getElementById('profilEmail').value,
      jam_operasional: document.getElementById('profilJam').value,
      alamat: document.getElementById('profilAlamat').value,
      sejarah: document.getElementById('profilSejarah').value,
      visi: document.getElementById('profilVisi').value,
      misi: document.getElementById('profilMisi').value,
      potensi: document.getElementById('profilPotensi').value,
    };
    try {
      const res = await fetch('/api/admin/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) showToast('Profil desa berhasil diperbarui!');
    } catch { showToast('Gagal menyimpan profil', 'error'); }
  });

  // ============================================
  // HELPERS
  // ============================================

  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
  }

  function formatDate(d) {
    if (!d) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const parts = d.split('-');
    return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
  }

  function formatDateTime(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ============================================
  // INIT
  // ============================================
  checkAuth();
});
