# PANDUAN LENGKAP — JANTRA PURNAMA 2026: PANGGILAN BOROBUDUR

**Web Aplikasi CMS & Landing Page (Single Page Application · Zero-build)**
Penyelenggara: **Yayasan Chakra Mandala Nusantara**
Event: **Senin, 26 Oktober 2026 · 16.30–23.15 WIB · Candi Borobudur, Magelang**
Kapasitas: **500 kursi** (Regular 300 · Premium 150 · VIP 50)

---

## 1. Ringkasan Produk

Satu aplikasi web yang menyatukan **dua produk** dalam **tiga berkas**:

| Berkas | Peran | Teknologi |
| --- | --- | --- |
| `PANDUAN.md` | Seluruh dokumentasi, arsitektur, API, dan SOP operasional | Markdown |
| `code.gs` | Backend **REST API** + mesin basis data 13 sheet + seeding + autentikasi | Google Apps Script |
| `index.html` | **Landing page premium** (sisi publik) + **Panel CMS** (sisi panitia) dalam satu SPA | HTML5 + CSS3 + Vanilla JS |

**Filosofi arsitektur:** tanpa build tool, tanpa framework, tanpa dependensi runtime. Cukup buka `index.html` (atau unggah ke hosting statis) dan seluruh produk berjalan. Bila `code.gs` dideploy, CMS berpindah otomatis dari **Demo Mode** ke **Live Spreadsheet**.

---

## 2. Struktur Berkas

```
jantra/
├── PANDUAN.md          # dokumen ini — panduan seluruh sistem
├── code.gs             # backend REST API & database engine (13 sheet)
├── index.html          # SPA: landing page + CMS (satu berkas, ±6500 baris)
├── README.md           # ringkasan singkat repositori
└── assets/             # 10 visual fotorealistik (tarik-ulur ringan, ≤260 KB)
    ├── hero-dancers.jpg     # hero utama (penari prada + Borobudur + purnama)
    ├── act1-relief.jpg      # Tahap I  — pembacaan relief
    ├── act2-pradaksina.jpg  # Tahap II — pradaksina lentera
    ├── act3-solahbowo.jpg   # Tahap III— 21 penari Solah Bowo
    ├── act4-gamelan.jpg     # Tahap IV — sound healing gamelan
    ├── act5-samadhi.jpg     # Tahap V  — samadhi mandala 500 jiwa
    ├── event-borobudur.jpg  # visual venue & bagian Event
    ├── dance-detail.jpg     # detail mudra penari (tari tradisional)
    ├── gallery-1.jpg        # gambyong & ansambel gamelan
    └── gallery-2.jpg        # wayang kulit (pembuka malam)
```

---

## 3. Cara Menjalankan (3 Langkah)

### 3.1 Mode Demo (tanpa backend — 0 menit)

1. Unduh seluruh berkas.
2. Buka `index.html` di peramban (Chrome/Edge/Safari/Firefox terbaru).
3. Selesai. Aplikasi memuat 13 sheet data demo realistis ke `localStorage`.

> Gunakan tombol **CMS** pada navbar → pilih salah satu akun demo → seluruh modul siap diuji, termasuk CRUD, verifikasi pembayaran, check-in, laporan, dan sinkronisasi.

### 3.2 Mode Live (Google Spreadsheet — ±5 menit)

1. Buat **Google Spreadsheet** baru (mis. `DB Jantra Purnama 2026`).
2. Menu **Extensions → Apps Script**, hapus isi default, tempelkan **seluruh isi `code.gs`**.
3. Jalankan fungsi `setupDatabase()` **satu kali** dan setujui izin akses.
   → Terbentuk otomatis **13 sheet** lengkap dengan header, format, dan data awal (aktivitas, narasumber, FAQ, artikel, pengaturan, pengguna).
4. **Deploy → New deployment → Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Salin **Web App URL** (`https://script.google.com/macros/s/.../exec`).
6. Pada aplikasi: **CMS → Integrasi & Backup → tempel URL → centang “Mode Live Spreadsheet” → Simpan Konfigurasi → Uji Koneksi**.
7. Tekan **Kirim Semua Data ke Sheet** untuk memindahkan data demo ke spreadsheet, atau **Tarik Data dari Sheet** untuk memuat data yang sudah ada di spreadsheet.

### 3.3 Mode Hosting Statis (produksi)

Unggah `index.html` + folder `assets/` ke GitHub Pages, Netlify, Cloudflare Pages, Vercel, atau hosting kampus. Tidak diperlukan Node.js, database, atau server aplikasi — backend ditangani Apps Script.

---

## 4. Landing Page — Struktur & Fitur (Sisi Publik)

Tema **Dark Cosmic** (malam purnama) dengan aksen **Gold** dan **Moonlight**; tipografi *Cormorant Garamond* (display) + *Plus Jakarta Sans* (UI).

| # | Bagian | Isi & fitur unggulan |
| --- | --- | --- |
| 0 | **Urgency bar** | Hitung mundur live + sisa kuota real-time |
| 1 | **Navbar lengket** | 8 tautan aktif otomatis, progres kuota, CTA beli tiket, tombol CMS, drawer mobile beranimasi bertahap |
| 2 | **Hero** | Judul animasi per kata, countdown 4 kotak, bar scarcity berkilau, avatar sosial-proof, dua kartu mengapung, partikel bintang & ember kanvas |
| 3 | **Marquee** | Pita berjalan: gamelan 432Hz, 500 lentera, tari sakral, relief, samadhi… |
| 4 | **Fasilitas (9 kartu)** | Pembacaan relief epigrafer, 21 penari, sound healing, lentera, dinner istana, dokumentasi, audio guide, shuttle, protokol konservasi |
| 5 | **Manfaat** | Dua blok split dengan foto + statistik mengapung, 4 kartu manfaat (batin, wawasan, jejaring, identitas) |
| 6 | **Event Jantra Purnama 2026** | Panel fakta (tanggal, waktu, lokasi, kapasitas), **timeline lengkap** dari registrasi hingga penutupan, 6 kartu informasi (dress code, akses, konsumsi, dokumentasi, keamanan, audio guide) |
| 7 | **5 Tahap Kultivasi** | Tab interaktif + panel detail: deskripsi lengkap, filosofi, manfaat, persiapan, pemandu, dan navigasi tahap |
| 8 | **Galeri interaktif** | Slider per tahap aktivitas (Semua/Relief/Pradaksina/Solah Bowo/Sound Healing/Samadhi), tombol prev/next, dot, thumbnail, autoplay, **usap (swipe)**, kontrol papan tombol (← →), lightbox layar penuh, grid tambahan 8 foto |
| 9 | **Narasumber** | Profil utama besar + kutipan, kartu maestro pendamping, tautan sosial |
| 10 | **Testimoni** | Ringkasan rating 4,9/5 dengan distribusi bintang, slider (3/2/1 kolom adaptif), tombol kirim testimoni (masuk moderasi) |
| 11 | **Harga & Paket** | Regular Rp1.500.000 · Premium Rp3.500.000 · VIP Rp7.500.000; bar keterisian per zona, tabel perbandingan 14 baris, 4 add-on |
| 12 | **Cek Tiket (Lookup)** | Pelacakan via kode tiket/email/telepon, **timeline 5 status**, pola verifikasi visual deterministik, unggah bukti transfer, tombol cetak e-ticket, salin kode |
| 13 | **FAQ** | 14 pertanyaan dengan filter kategori + akordion aksesibel |
| 14 | **Artikel** | 6 editorial dengan pembaca modal layar lebar |
| 15 | **Kontak & Newsletter** | Formulir tervalidasi (masuk sheet Messages) + Lingkar Warta Purnama (sheet Subscribers) |
| 16 | **CTA puncak** | Countdown kedua, dua CTA (beli & tanya ketersediaan), jaminan pembayaran |
| 17 | **Footer** | 4 kolom (brand + newsletter, jelajahi, peserta, kontak), legal, tautan CMS |
| 18 | **Floating** | WhatsApp mengambang (denyut), tombol ke atas, CTA mobile menempel bawah |

### 4.1 Konversi penjualan tiket (urgensi & storytelling)

- **Countdown ganda** (bilah atas, hero, CTA puncak) menuju 26 Oktober 2026.
- **Scarcity nyata** dari data Spreadsheet: “X kursi terjual (Y%) — sisa Z kursi”.
- **Bukti sosial**: 1.200+ alumni, rating 4,9/5, deretan avatar peserta.
- **Alur checkout 4 langkah** (zona → data peserta → pembayaran → e-ticket) dengan validasi langsung, promo (`PURNAMA26` 10%, `SANGGA10` 12%), ringkasan harga mengambang, konfeti, dan tombol WhatsApp yang otomatis menuliskan seluruh detail pesanan.
- **Pengurangan risiko**: instruksi transfer bank jelas + salin nomor rekening, batas waktu 24 jam, kebijakan refund, FAQ pembayaran.

### 4.2 Animasi & mikrointeraksi

Scroll reveal (fade/slide/scale/blur dengan delay bertahap), entri judul hero per kata, marquee, denyut dot live, kilau bar kuota, tilt 3D kartu, ripple klik, glow kursor, count-up angka, parallax partikel kanvas, hover lift, transisi tab/slider/akordion, toast bergaya, confetti, boot screen bercahaya. Seluruhnya otomatis dinonaktifkan pada `prefers-reduced-motion`.

---

## 5. Panel CMS — Modul & Fungsi (Sisi Panitia)

Tema **Bright Nusantara Light** (cerah, bersih, modern) — jeda otomatis dari tema gelap landing page.

| Modul | Fungsi |
| --- | --- |
| **Dashboard** | 4 KPI (tiket terjual, revenue, sisa kuota, nilai rata-rata pesanan), grafik tren 14 hari, donut komposisi kategori, bar revenue per zona, feed audit terbaru, daftar “perlu tindakan”, 10 pesanan terbaru, kuota per zona |
| **Laporan & Analitik** | Filter 7/14/30 hari/seluruh periode, kurva akumulasi, distribusi status, kinerja per kategori, 10 kota teratas, rekap transaksi terverifikasi, ekspor CSV, cetak/PDF |
| **Tiket Peserta** | Tabel penuh: pencarian, filter kategori/status/bayar, urut terbaru, paginasi, pilih massal (**verifikasi, tandai lunas, ekspor, hapus**), aksi baris cepat (check-in, verifikasi), detail drawer dengan timeline peserta |
| **Verifikasi Pembayaran** | Filter status/bank, setujui/tolak (sinkron otomatis ke status tiket), pratinjau bukti transfer dalam lightbox |
| **Check-In Gate** | Validasi kode tiket: berhasil / sudah check-in / belum lunas (dengan tombol verifikasi) / tidak ditemukan; daftar hadir live + ekspor CSV |
| **Newsletter** | CRUD pelanggan, status aktif/berhenti, ekspor |
| **Aktivitas (5 Tahap)** | CRUD lengkap 16 kolom (jadwal, mentor, narasi, filosofi, manfaat, persiapan, galeri gambar JSON, status) |
| **Narasumber** | CRUD profil, kredensial, kutipan, tautan sosial, penanda narasumber utama, urutan |
| **Galeri Foto** | Grid visual, filter tahap + unggulan, CRUD gambar, dan **Isi Cepat dari Aktivitas** (sinkronisasi otomatis foto utama tiap tahap) |
| **Testimoni** | Moderasi: setujui/tolak, unggulkan, **Setujui Semua Pending**, filter tab status |
| **FAQ** | CRUD + statistik sebaran kategori |
| **Artikel** | CRUD editorial, pratinjau, terbitkan/jadikan draf |
| **Pesan Masuk** | Kotak masuk dengan tab status, balas via WhatsApp/Email sekali klik, tandai dibalas, arsipkan |
| **Pengguna & Peran** | CRUD akun, 3 peran, kartu penjelasan hak akses, kata sandi disimpan sebagai hash (fase Live) |
| **Audit Log** | 30+ entri awal, filter aksi/modul, pencarian, ekspor, pembersihan terjaga |
| **Pengaturan Global** | 24 pengaturan dalam 6 kategori (umum, event, tiket, kontak, pembayaran, peserta) — perubahan **langsung** mengubah harga & kuota di landing page |
| **Integrasi & Backup** | Konfigurasi Web App URL, uji koneksi, tarik/kirim data 13 sheet, reset data demo, **unduh & pulihkan backup JSON**, dokumentasi endpoint |

### 5.1 Peran & hak akses

| Peran | Akses modul |
| --- | --- |
| **Super Admin** | Seluruh modul + Pengguna, Pengaturan, Audit, Integrasi (`*`) |
| **Manajer Event** | Dashboard, Laporan, seluruh konten (Aktivitas, Narasumber, Galeri, Testimoni, FAQ, Artikel), Newsletter, Pesan, Audit, Integrasi |
| **Front Office** | Dashboard, Tiket, Verifikasi Pembayaran, Check-In, Newsletter, Pesan |

Menu yang tidak diizinkan otomatis disembunyikan, dan pemanggilan rute secara manual ditolak dengan notifikasi sopan.

### 5.2 Akun demo (klik untuk mengisi otomatis pada layar login)

| Pengguna | Kata sandi | Peran |
| --- | --- | --- |
| `superadmin` | `AdminJantra2026!` | Ki Ageng Suryo — Super Admin |
| `manajer` | `ManajerJantra2026!` | R.A. Sekar Arum — Manajer Event |
| `frontoffice` | `FoJantra2026!` | Bagas Pramudya — Front Office |

> Pada mode Demo, autentikasi diverifikasi lokal di peramban untuk keperluan demonstrasi. Pada mode Live, verifikasi dilakukan di server Apps Script (SHA-256 + salt, token sesi 24 jam, audit `LOGIN_SUCCESS`/`LOGIN_FAILED`).

---

## 6. Basis Data — Skema 13 Sheet

| Sheet | Kolom utama | Fungsi |
| --- | --- | --- |
| `Tickets` | ticketCode, fullName, email, phone, age, city, category, price, quantity, totalAmount, bankChoice, paymentStatus, ticketStatus, checkInTime | Data pemesanan & check-in |
| `Payments` | paymentCode, ticketCode, bankName, accountSender, amount, proofUrl, status, verifiedBy, verifiedAt | Verifikasi transfer BPD DIY / Mandiri |
| `Activities` | stageNumber, title, subtitle, scheduleTime, location, mentor, badge, shortDesc, fullDesc, philosophy, benefits, preparation, mainImage, galleryImages | 5 tahap kultivasi |
| `Speakers` | name, role, credentials, topic, bio, quote, photoUrl, social, isMain, orderNum | Narasumber & maestro |
| `Gallery` | title, stageCategory, caption, imageUrl, photographer, isFeatured, orderNum | Galeri per tahap |
| `Testimonials` | name, role, city, ticketCategory, rating, comment, avatarUrl, status, isFeatured | Ulasan & moderasi |
| `FAQs` | question, answer, category, orderNum, status | Akordion bantuan |
| `Articles` | title, slug, category, author, readTime, excerpt, content, coverImage, publishedAt, status | Editorial |
| `Subscribers` | email, name, source, status, subscribedAt | Lingkar Warta Purnama |
| `Messages` | name, email, phone, subject, message, status, repliedBy | Kotak masuk sekretariat |
| `Settings` | key, value, label, category | 24 konfigurasi global |
| `Users` | username, fullName, email, role, passwordHash, salt, status, lastLogin | Akun panitia |
| `AuditLog` | timestamp, actor, role, action, module, targetId, details, ipInfo | Jejak audit |

Pengaturan penting: `totalQuota` (500), `quotaRegular` (300), `quotaPremium` (150), `quotaVIP` (50), `priceRegular`, `pricePremium`, `priceVIP`, `paymentDeadlineHours` (24), `whatsappAdmin`, `emailAdmin`, `bankBpdDiy`, `bankMandiri`, `minAge` (15), `maxSeatPerOrder` (10).

---

## 7. REST API (code.gs)

**Base URL:** `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`

### GET

| Aksi | Contoh | Keterangan |
| --- | --- | --- |
| `ping` | `?action=ping` | Uji koneksi, nama app, versi, penyelenggara |
| `publicData` | `?action=publicData` | Seluruh konten publik (settings, kuota, aktivitas, narasumber, galeri, testimoni tayang, FAQ, artikel) |
| `lookupTicket` | `?action=lookupTicket&query=JP26-VIP-1001` | Pelacakan tiket via kode/email/telepon |
| `dashboard` | `?action=dashboard` | Snapshot penuh 13 sheet (khusus panitia) |
| `list` | `?action=list&sheet=FAQs` | Daftar isi satu sheet |

### POST (JSON body, `Content-Type: text/plain` agar lolos CORS Apps Script)

| Aksi | Muatan | Keterangan |
| --- | --- | --- |
| `login` | `{username, password}` | Token sesi + data pengguna (SHA-256 + salt) |
| `bookTicket` | data peserta & tiket | Membuat tiket + invoice, validasi usia ≥15 |
| `confirmPayment` | `{ticketCode, bankName, accountSender, proofUrl, notes}` | Peserta mengirim bukti transfer |
| `verifyPayment` | `{ticketCode, status, actor, role}` | Verifikasi → tiket aktif; tolak → dibatalkan |
| `checkInTicket` | `{ticketCode, actor, role}` | Check-in gerbang |
| `submitContact` | `{name, email, phone, subject, message}` | Pesan kontak |
| `subscribeNewsletter` | `{email, name, source}` | Langganan warta |
| `submitTestimonial` | `{name, role, rating, comment}` | Testimoni → status Pending |
| `create` / `update` / `delete` | `{sheet, record, keyField, keyValue, actor, role}` | **CRUD generik 13 sheet** |
| `saveSettings` | `{settings:{key:value}}` | Simpan konfigurasi global |
| `syncAll` | `{database:{...13 sheet...}}` | Sinkronisasi penuh dari aplikasi ke Spreadsheet |
| `resetDemoData` | – | Bangun ulang seluruh sheet & seed data awal |

Semua respons berformat `{ ok: true|false, ... }`; setiap perubahan data tercatat pada `AuditLog` (`CREATE`, `UPDATE`, `DELETE`, `VERIFY_PAYMENT`, `CHECKIN_TICKET`, `SYNC_ALL`, `LOGIN_SUCCESS`, `LOGIN_FAILED`).

`code.gs` juga menyediakan: `setupDatabase(forceReset)`, `getSheetRows_`, `insertRow_`, `insertManyRows_`, `updateRowById_`, `deleteRowById_`, `hashPassword_` (SHA-256 + salt), `generateSessionToken_`, `logAudit_`, serta `LockService` agar penulisan bersamaan tetap aman.

---

## 8. SOP Operasional Ringkas

**Front Office**
1. Buka **Verifikasi Pembayaran** → periksa mutasi bank → *Setujui* (tiket otomatis aktif) atau *Tolak*.
2. Hari-H: buka **Check-In Gate** → masukkan/scan kode tiket → status otomatis `Checked-In` + waktu tercatat.
3. Ekspor **daftar hadir** untuk laporan ke BPCB.

**Manajer Event**
1. Perbarui **Aktivitas** bila ada penyesuaian jadwal/mentor.
2. Kelola **Galeri Foto** per tahap (gunakan *Isi Cepat dari Aktivitas*).
3. Moderasi **Testimoni** dan jadikan unggulan bila layak tampil di halaman utama.
4. Pantau **Laporan & Analitik** untuk keputusan promosi kuota.

**Super Admin**
1. Perbarui **Pengaturan Global** (harga, kuota, rekening, kontak) — langsung tampil di landing page.
2. Kelola **Pengguna** dan tinjau **Audit Log** berkala.
3. Di **Integrasi & Backup**: uji koneksi, sinkronkan data, unduh backup JSON sebelum perubahan besar.

---

## 9. Aksesibilitas, Responsivitas, & Kualitas

- **Mobile-first** dengan breakpoint 1180 / 980 / 760 / 420 px; sidebar CMS off-canvas, tabel dapat digulir, CTA bawah menempel.
- **Aksesibilitas**: skip link, landmark semantik, `aria-label`/`aria-expanded`/`role=tab|dialog|region`, `aria-live` untuk toast & hasil pelacakan, fokus terlihat (`:focus-visible`), **focus trap** pada modal, tutup dengan `Esc`, navigasi slider via papan tombol, kontras teks ≥ 4,5:1, serta dukungan `prefers-reduced-motion`.
- **Kinerja**: satu berkas HTML tanpa dependensi JS eksternal; gambar <=260 KB dengan `loading="lazy"`, `decoding="async"`, dan `fetchpriority` pada hero.
- **Ketahanan**: basis data lokal di `localStorage` (dengan fallback bila penuh), API call hanya dijalankan bila mode Live aktif, seluruh aksi destruktif melalui dialog konfirmasi dan tercatat pada Audit Log.
- **Pencetakan**: gaya cetak khusus untuk e-ticket, laporan, dan daftar hadir (elemen navigasi disembunyikan).

---

## 10. Pemecahan Masalah

| Gejala | Penyelidikan |
| --- | --- |
| “Uji Koneksi” gagal | Pastikan deployment Apps Script disetel **Anyone**, gunakan URL `/exec` (bukan `/dev`), lalu redeploy bila kode berubah |
| Data CMS tidak berubah di Spreadsheet | Mode Live belum aktif atau URL belum disimpan; tekan **Kirim Semua Data ke Sheet** |
| Perubahan harga tidak muncul di landing page | Pastikan tersimpan pada **Pengaturan Global**; harga kuota dibaca dari `Settings` (`priceRegular`, `pricePremium`, `priceVIP`) |
| Kuota tidak bertambah setelah penghapusan tiket | Kuota dihitung dari tiket berstatus selain `Cancelled`; ubah status atau hapus tiket terkait |
| Gambar tidak tampil | Letakkan berkas di `assets/` atau gunakan URL gambar absolut (`https://…`) |
| Ingin mengosongkan data uji | **Integrasi & Backup → Reset ke Data Demo**, atau jalankan `resetDemoData` di Apps Script |
| Login demo gagal | Gunakan tiga akun demo pada tabel §5.2, atau tekan salah satu kartu akun agar terisi otomatis |

---

## 11. Peta Jalan (Roadmap)

- **Fase 1–2 (selesai):** landing page premium, CMS inti, skema 13 sheet, REST API, autentikasi multi-peran, audit log.
- **Fase 3:** payment gateway (Midtrans/Xendit) untuk verifikasi otomatis.
- **Fase 4:** QR Code scanner check-in mandiri di lokasi (struktur tombol kamera sudah tersedia di modul Check-In).
- **Fase 5:** WhatsApp Business API untuk notifikasi otomatis (konfirmasi, pengingat pembayaran, e-ticket).

---

*“Purnama tidak menunggu. Anda bisa memilih.”*
**Yayasan Chakra Mandala Nusantara · Jantra Purnama 2026 — Panggilan Borobudur**
