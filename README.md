# Jantra Purnama 2026 — Panggilan Borobudur

Web aplikasi **SPA 3 berkas** (zero-build) untuk event spiritual-budaya eksklusif di Candi Borobudur, 26 Oktober 2026.
Penyelenggara: **Yayasan Chakra Mandala Nusantara** · Kapasitas **500 kursi**.

| Berkas | Peran |
| --- | --- |
| [`PANDUAN.md`](PANDUAN.md) | Dokumentasi lengkap: arsitektur, deployment, REST API, skema 13 sheet, SOP panitia, pemecahan masalah |
| [`code.gs`](code.gs) | Backend **REST API** Google Apps Script + database 13 sheet + autentikasi SHA-256 + audit log |
| [`index.html`](index.html) | **Landing page premium** (dark cosmic, penuh visual tarian tradisional) + **Panel CMS** (bright, mobile-first) |
| `assets/` | 10 visual fotorealistik: penari prada, relief, pradaksina, sound healing gamelan, samadhi, wayang, dll. |

## Mulai cepat

1. **Demo Mode** — buka `index.html`, klik **CMS** di navbar, pilih akun demo (`superadmin` / `AdminJantra2026!`). Semua modul (CRUD, verifikasi pembayaran, check-in, laporan, backup) langsung berfungsi dengan 13 sheet data demo.
2. **Live Mode** — tempel isi `code.gs` ke Apps Script, jalankan `setupDatabase()` sekali, deploy sebagai Web app (*Anyone*), lalu masukkan URL-nya di **CMS → Integrasi & Backup**.

## Yang ada di dalamnya

- **Landing page**: urgency bar + countdown, hero animasi, fasilitas, manfaat, detail event + timeline, **5 tahap kultivasi**, **slider galeri interaktif per aktivitas** (lightbox, swipe, keyboard), narasumber, testimoni, harga 3 kategori + tabel perbandingan, checkout WhatsApp 4 langkah, pelacakan tiket, FAQ, artikel, kontak, newsletter, floating WhatsApp.
- **CMS**: dashboard analitik, laporan, tiket, verifikasi pembayaran, check-in gate, newsletter, aktivitas, narasumber, galeri, moderasi testimoni, FAQ, artikel, pesan masuk, pengguna & peran, audit log, pengaturan global, integrasi & backup JSON.
- **Kualitas**: mobile-first, aksesibel (ARIA, focus trap, `prefers-reduced-motion`), animasi halus (scroll reveal, staggered, hover, mikrointeraksi), dan gaya cetak untuk e-ticket/laporan.
