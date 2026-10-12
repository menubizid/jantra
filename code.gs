/**
 * ============================================================================
 * JANTRA PURNAMA 2026: PANGGILAN BOROBUDUR
 * Backend REST API & Database Engine — Google Apps Script (code.gs)
 * Penyelenggara: Yayasan Chakra Mandala Nusantara
 * ============================================================================
 *
 * Skema Database (13 Sheet Google Spreadsheet):
 *  1. Tickets       - Data pemesanan tiket peserta (Kuota 500 kursi)
 *  2. Payments      - Data transaksi & verifikasi pembayaran (BPD DIY / Mandiri)
 *  3. Activities    - 5 Tahap Kultivasi & koleksi foto slider per aktivitas
 *  4. Speakers      - Profil narasumber utama & maestro pendamping
 *  5. Gallery       - Galeri foto eksperiensial & dokumentasi tarian tradisional
 *  6. Testimonials  - Ulasan & rating peserta (dengan moderasi)
 *  7. FAQs          - Pertanyaan umum (akordion)
 *  8. Articles      - Artikel editorial budaya & spiritualitas Borobudur
 *  9. Subscribers   - Daftar pelanggan newsletter purnama
 * 10. Messages      - Pesan masuk dari formulir kontak publik
 * 11. Settings      - Konfigurasi global situs, rekening, kuota, & harga
 * 12. Users         - Akun pengguna multi-role (Super Admin, Manajer Event, FO)
 * 13. AuditLog      - Rekam jejak aktivitas keamanan & perubahan data
 *
 * Cara Penggunaan Singkat:
 * 1. Buat Google Spreadsheet baru, buka Extensions > Apps Script.
 * 2. Salin seluruh kode dalam file `code.gs` ini ke editor Apps Script.
 * 3. Jalankan fungsi `setupDatabase()` sekali untuk membuat 13 sheet + data awal.
 * 4. Klik Deploy > New deployment > Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin Web App URL dan tempelkan ke menu Pengaturan > Integrasi API di CMS.
 * ============================================================================
 */

const APP_CONFIG = {
  APP_NAME: 'Jantra Purnama 2026 CMS & Ticketing API',
  VERSION: '2.6.0',
  ORGANIZER: 'Yayasan Chakra Mandala Nusantara',
  EVENT_DATE: '2026-10-26T16:30:00+07:00',
  TOTAL_QUOTA: 500,
  TOKEN_TTL_HOURS: 24
};

const SHEET_SCHEMAS = {
  Tickets: [
    'id', 'ticketCode', 'fullName', 'email', 'phone', 'age', 'city',
    'category', 'price', 'quantity', 'totalAmount', 'bankChoice',
    'paymentStatus', 'ticketStatus', 'notes', 'checkInTime',
    'createdAt', 'updatedAt'
  ],
  Payments: [
    'id', 'paymentCode', 'ticketCode', 'fullName', 'email', 'phone',
    'bankName', 'accountSender', 'amount', 'proofUrl', 'status',
    'verifiedBy', 'verifiedAt', 'notes', 'createdAt', 'updatedAt'
  ],
  Activities: [
    'id', 'stageNumber', 'title', 'subtitle', 'scheduleTime', 'duration',
    'location', 'mentor', 'badge', 'shortDesc', 'fullDesc', 'philosophy',
    'benefits', 'preparation', 'mainImage', 'galleryImages', 'status', 'updatedAt'
  ],
  Speakers: [
    'id', 'name', 'role', 'credentials', 'topic', 'bio', 'quote',
    'photoUrl', 'instagram', 'linkedin', 'isMain', 'orderNum', 'status', 'updatedAt'
  ],
  Gallery: [
    'id', 'title', 'stageCategory', 'caption', 'imageUrl',
    'photographer', 'isFeatured', 'orderNum', 'createdAt'
  ],
  Testimonials: [
    'id', 'name', 'role', 'city', 'ticketCategory', 'rating',
    'comment', 'avatarUrl', 'eventYear', 'status', 'isFeatured', 'createdAt'
  ],
  FAQs: [
    'id', 'question', 'answer', 'category', 'orderNum', 'status', 'updatedAt'
  ],
  Articles: [
    'id', 'title', 'slug', 'category', 'author', 'readTime',
    'excerpt', 'content', 'coverImage', 'publishedAt', 'status', 'updatedAt'
  ],
  Subscribers: [
    'id', 'email', 'name', 'source', 'status', 'subscribedAt'
  ],
  Messages: [
    'id', 'name', 'email', 'phone', 'subject', 'message',
    'status', 'repliedBy', 'createdAt', 'updatedAt'
  ],
  Settings: [
    'key', 'value', 'label', 'category', 'updatedAt'
  ],
  Users: [
    'id', 'username', 'fullName', 'email', 'role',
    'passwordHash', 'salt', 'status', 'lastLogin', 'createdAt'
  ],
  AuditLog: [
    'id', 'timestamp', 'actor', 'role', 'action',
    'module', 'targetId', 'details', 'ipInfo'
  ]
};

/**
 * ============================================================================
 * 1. HTTP ENTRY POINTS (GET & POST REST API)
 * ============================================================================
 */

function doGet(e) {
  try {
    ensureDatabaseInitialized_();
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'ping';

    switch (action) {
      case 'ping':
        return jsonResponse_({
          ok: true,
          app: APP_CONFIG.APP_NAME,
          version: APP_CONFIG.VERSION,
          organizer: APP_CONFIG.ORGANIZER,
          timestamp: new Date().toISOString()
        });

      case 'publicData':
      case 'init':
        return jsonResponse_({
          ok: true,
          data: getPublicPayload_()
        });

      case 'lookupTicket':
        return jsonResponse_(handleTicketLookup_(params.query || ''));

      case 'dashboard':
        return jsonResponse_({
          ok: true,
          data: getFullDatabaseSnapshot_()
        });

      case 'list': {
        const sheetName = params.sheet;
        if (!SHEET_SCHEMAS[sheetName]) {
          return jsonError_('Sheet tidak valid: ' + sheetName, 400);
        }
        return jsonResponse_({
          ok: true,
          sheet: sheetName,
          rows: getSheetRows_(sheetName)
        });
      }

      default:
        return jsonError_('Action GET tidak dikenal: ' + action, 400);
    }
  } catch (err) {
    return jsonError_('Internal Server Error (GET): ' + err.message, 500);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    ensureDatabaseInitialized_();
    const body = parseRequestBody_(e);
    const action = body.action || '';

    switch (action) {
      case 'login':
        return jsonResponse_(handleLogin_(body));

      case 'bookTicket':
        return jsonResponse_(handleBookTicket_(body));

      case 'confirmPayment':
        return jsonResponse_(handleConfirmPayment_(body));

      case 'verifyPayment':
        return jsonResponse_(handleVerifyPayment_(body));

      case 'checkInTicket':
        return jsonResponse_(handleCheckInTicket_(body));

      case 'submitContact':
        return jsonResponse_(handleSubmitContact_(body));

      case 'subscribeNewsletter':
        return jsonResponse_(handleSubscribeNewsletter_(body));

      case 'submitTestimonial':
        return jsonResponse_(handleSubmitTestimonial_(body));

      case 'create':
        return jsonResponse_(handleCrudCreate_(body));

      case 'update':
        return jsonResponse_(handleCrudUpdate_(body));

      case 'delete':
        return jsonResponse_(handleCrudDelete_(body));

      case 'saveSettings':
        return jsonResponse_(handleSaveSettings_(body));

      case 'syncAll':
        return jsonResponse_(handleSyncAll_(body));

      case 'resetDemoData':
        setupDatabase(true);
        return jsonResponse_({
          ok: true,
          message: 'Database 13 sheet berhasil di-reset ke data awal Jantra Purnama 2026.',
          data: getFullDatabaseSnapshot_()
        });

      default:
        return jsonError_('Action POST tidak dikenal: ' + action, 400);
    }
  } catch (err) {
    return jsonError_('Internal Server Error (POST): ' + err.message, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * ============================================================================
 * 2. DATABASE SETUP & SEEDING (13 SHEETS)
 * ============================================================================
 */

function setupDatabase(forceReset) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNames = Object.keys(SHEET_SCHEMAS);

  sheetNames.forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    } else if (forceReset) {
      sheet.clear();
    }

    const headers = SHEET_SCHEMAS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1E293B')
        .setFontColor('#F8FAFC');
      sheet.setFrozenRows(1);
    }
  });

  seedInitialData_();
  logAudit_('SYSTEM', 'Super Admin', 'SETUP_DB', 'System', 'ALL_13_SHEETS', 'Inisialisasi skema 13 sheet & seed data awal Jantra Purnama 2026');
  return 'Setup 13 Sheet Database Jantra Purnama 2026 Selesai!';
}

function ensureDatabaseInitialized_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Tickets') || !ss.getSheetByName('Settings')) {
    setupDatabase(false);
  }
}

function seedInitialData_() {
  const now = new Date().toISOString();

  // 1. Settings
  if (getSheetRows_('Settings').length === 0) {
    const defaultSettings = [
      { key: 'siteName', value: 'Jantra Purnama 2026: Panggilan Borobudur', label: 'Nama Situs & Event', category: 'General', updatedAt: now },
      { key: 'organizer', value: 'Yayasan Chakra Mandala Nusantara', label: 'Penyelenggara Resmi', category: 'General', updatedAt: now },
      { key: 'eventDate', value: '2026-10-26T16:30:00+07:00', label: 'Tanggal & Waktu Pelaksanaan', category: 'Event', updatedAt: now },
      { key: 'eventLocation', value: 'Pelataran Aksobhya & Zona Mandala Candi Borobudur, Magelang', label: 'Lokasi Event', category: 'Event', updatedAt: now },
      { key: 'totalQuota', value: '500', label: 'Total Kuota Kursi', category: 'Ticketing', updatedAt: now },
      { key: 'quotaRegular', value: '300', label: 'Kuota Tiket Regular', category: 'Ticketing', updatedAt: now },
      { key: 'quotaPremium', value: '150', label: 'Kuota Tiket Premium', category: 'Ticketing', updatedAt: now },
      { key: 'quotaVIP', value: '50', label: 'Kuota Tiket VIP', category: 'Ticketing', updatedAt: now },
      { key: 'priceRegular', value: '1500000', label: 'Harga Tiket Regular (Rp)', category: 'Ticketing', updatedAt: now },
      { key: 'pricePremium', value: '3500000', label: 'Harga Tiket Premium (Rp)', category: 'Ticketing', updatedAt: now },
      { key: 'priceVIP', value: '7500000', label: 'Harga Tiket VIP (Rp)', category: 'Ticketing', updatedAt: now },
      { key: 'whatsappAdmin', value: '628112682026', label: 'Nomor WhatsApp Konfirmasi', category: 'Contact', updatedAt: now },
      { key: 'emailAdmin', value: 'sekretariat@jantrapurnama.id', label: 'Email Resmi Panitia', category: 'Contact', updatedAt: now },
      { key: 'bankBpdDiy', value: 'Bank BPD DIY • 001.221.002026 • a.n. Yayasan Chakra Mandala Nusantara', label: 'Rekening Bank BPD DIY', category: 'Payment', updatedAt: now },
      { key: 'bankMandiri', value: 'Bank Mandiri • 137-00-26102026-8 • a.n. Yayasan Chakra Mandala Nusantara', label: 'Rekening Bank Mandiri', category: 'Payment', updatedAt: now }
    ];
    insertManyRows_('Settings', defaultSettings);
  }

  // 2. Users (Multi-role dengan SHA-256 + Salt)
  if (getSheetRows_('Users').length === 0) {
    const saltAdmin = 'jp26_salt_adm_99';
    const saltMgr = 'jp26_salt_mgr_88';
    const saltFo = 'jp26_salt_fo_77';
    const defaultUsers = [
      {
        id: 'USR-001',
        username: 'superadmin',
        fullName: 'Ki Ageng Suryo (Super Admin)',
        email: 'admin@jantrapurnama.id',
        role: 'Super Admin',
        passwordHash: hashPassword_('AdminJantra2026!', saltAdmin),
        salt: saltAdmin,
        status: 'Active',
        lastLogin: now,
        createdAt: now
      },
      {
        id: 'USR-002',
        username: 'manajer',
        fullName: 'R.A. Sekar Arum (Manajer Event)',
        email: 'manajer@jantrapurnama.id',
        role: 'Manajer Event',
        passwordHash: hashPassword_('ManajerJantra2026!', saltMgr),
        salt: saltMgr,
        status: 'Active',
        lastLogin: now,
        createdAt: now
      },
      {
        id: 'USR-003',
        username: 'frontoffice',
        fullName: 'Bagas Pramudya (Front Office)',
        email: 'fo@jantrapurnama.id',
        role: 'Front Office',
        passwordHash: hashPassword_('FoJantra2026!', saltFo),
        salt: saltFo,
        status: 'Active',
        lastLogin: now,
        createdAt: now
      }
    ];
    insertManyRows_('Users', defaultUsers);
  }

  // 3. Activities (5 Tahap Kultivasi)
  if (getSheetRows_('Activities').length === 0) {
    const defaultActivities = [
      {
        id: 'ACT-01',
        stageNumber: 1,
        title: 'Pembacaan Relief Suci',
        subtitle: 'Menyingkap Kode Kosmik Karmawibhangga & Lalitavistara',
        scheduleTime: '16.30 – 18.00 WIB',
        duration: '90 Menit',
        location: 'Koridor Kamadhatu & Rupadhatu Sisi Timur Candi Borobudur',
        mentor: 'Goenawan A. Sambodo, S.S., M.T.',
        badge: 'Tahap I • Pencerahan Akal Budi',
        shortDesc: 'Menelusuri pahatan batu andesit berusia 1.200 tahun saat senja turun, membaca pesan hukum sebab-akibat dan perjalanan kesadaran menuju pencerahan.',
        fullDesc: 'Tahap pembuka Jantra Purnama 2026 mengajak peserta menyelami Borobudur bukan sebagai monumen bisu, melainkan kitab suci raksasa yang hidup. Dipandu langsung oleh pakar epigrafi Goenawan A. Sambodo, S.S., M.T., peserta akan membaca narasi relief Lalitavistara dan Karmawibhangga secara runtut sambil menyaksikan gradasi langit senja keemasan di atas Perbukitan Menoreh.',
        philosophy: 'Kamadhatu & Rupadhatu mengajarkan bahwa sebelum manusia mencapai keheningan tertinggi, ia wajib memahami hukum keterhubungan semesta (Pratityasamutpada) yang terpahat pada setiap panel relief.',
        benefits: 'Memahami makna simbolik mudra, stupa, dan relief; menjernihkan perspektif hidup; membuka kesadaran intelektual dan spiritual sebelum memasuki ritual malam.',
        preparation: 'Mengenakan busana putih/wastra sopan, alas kaki ramah batu candi (upana), serta membawa buku jurnal mandala yang disediakan panitia.',
        mainImage: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1400&q=85',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=85'
        ]),
        status: 'Published',
        updatedAt: now
      },
      {
        id: 'ACT-02',
        stageNumber: 2,
        title: 'Pradaksina Purnama',
        subtitle: 'Ritual Berjalan Meditatif Mengelilingi Mandala Suci',
        scheduleTime: '18.15 – 19.15 WIB',
        duration: '60 Menit',
        location: 'Jalur Lingkar Mandala Utama Candi Borobudur',
        mentor: 'Dewan Pandita & Pamong Budaya Mandala',
        badge: 'Tahap II • Penyelarasan Langkah & Napas',
        shortDesc: 'Berjalan melingkar searah jarum jam sebanyak tiga putaran suci dalam keheningan penuh sambil membawa lentera purnama dan merapalkan niat kebajikan.',
        fullDesc: 'Saat bulan purnama mulai terbit di ufuk timur Borobudur, 500 peserta melakukan Pradaksina—ritual penghormatan kuno dengan berjalan searah jarum jam mengelilingi candi di sisi kanan. Setiap langkah diselaraskan dengan tarikan dan hembusan napas sadar (Anapanasati), menciptakan pusaran energi damai yang menyatukan langkah kaki dengan detak bumi Jawa.',
        philosophy: 'Gerak melingkar searah putaran tata surya melambangkan penghormatan terhadap pusat kesadaran tertinggi di puncak Arupadhatu.',
        benefits: 'Menurunkan ketegangan sistem saraf, melatih mindfulness dalam gerak (walking meditation), dan membersihkan residu emosi negatif.',
        preparation: 'Menjaga keheningan mutlak (Noble Silence), memegang lentera purnama di depan dada, dan melangkah selaras dengan irama genta pemandu.',
        mainImage: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1400&q=85',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85'
        ]),
        status: 'Published',
        updatedAt: now
      },
      {
        id: 'ACT-03',
        stageNumber: 3,
        title: 'Solah Bowo: Tari Sakral Purnama',
        subtitle: 'Persembahan Mahakarya Tari Klasik Tradisional Jawa di Pelataran Candi',
        scheduleTime: '19.30 – 20.45 WIB',
        duration: '75 Menit',
        location: 'Panggung Agung Aksobhya (Berlatar Siluet Megah Candi Borobudur)',
        mentor: 'Kanjeng Nyai Retno Kusumo & 21 Penari Klasik Mataram',
        badge: 'Tahap III • Mahakarya Gerak Jiwa & Budaya',
        shortDesc: 'Sajian visual dan spiritual paling memukau: tarian sakral klasik Jawa dengan busana prada keemasan di bawah cahaya obor dan purnama penuh.',
        fullDesc: 'Puncak estetika budaya Jantra Purnama 2026. Dua puluh satu penari keraton mempersembahkan "Solah Bowo Mandhala"—koreografi sakral yang dihidupkan kembali dari pahatan relief tari Lalitavistara Borobudur dan tradisi Bedhaya Jawa Kuno. Setiap kibasan sampur sutra, tatapan mata teduh, dan pola lantai mandala menghadirkan keindahan magis yang menggetarkan batin.',
        philosophy: 'Dalam tradisi Jawa Kuno, "Solah Bowo" bukan sekadar tarian tontonan, melainkan yoga gerak (Natya Yoga) yang menyatukan wiraga (raga), wirama (irama kosmos), dan wirasa (rasa ketuhanan).',
        benefits: 'Membangkitkan rasa kagum estetik yang mendalam (Rasa), membuka cakra jantung melalui keindahan harmoni budaya leluhur, serta pengalaman visual tak terlupakan.',
        preparation: 'Duduk nyaman sesuai zona tiket (VIP Ring-1, Premium Front Row, atau Regular Amphitheater) tanpa menggunakan lampu kilat kamera.',
        mainImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1400&q=85',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85'
        ]),
        status: 'Published',
        updatedAt: now
      },
      {
        id: 'ACT-04',
        stageNumber: 4,
        title: 'Sound Healing Gamelan Kuno',
        subtitle: 'Resonansi Frekuensi Suci 432Hz Gangsa, Gender & Gong Ageng',
        scheduleTime: '20.45 – 21.45 WIB',
        duration: '60 Menit',
        location: 'Pelataran Rumput Mandala & Taman Aksobhya',
        mentor: 'Ki Raharjo Pangarsa & Ansambel Gamelan Tirta Purnama',
        badge: 'Tahap IV • Terapi Getaran Suara Nusantara',
        shortDesc: 'Mandi gelombang suara (sound bath) menggunakan instrumen gamelan perunggu tempaan kuno yang ditala khusus pada frekuensi penyembuhan.',
        fullDesc: 'Berbeda dari pertunjukan karawitan biasa, Sound Healing Gamelan di Jantra Purnama dirancang sebagai terapi bio-akustik. Denting lembut gender, dengung panjang gong ageng, suling bambu, dan mangkuk perunggu Nusantara dimainkan dalam tempo meditatif untuk menurunkan gelombang otak peserta dari Beta menuju Alpha dan Theta.',
        philosophy: 'Perunggu gamelan (gangsa) adalah perpaduan timah dan tembaga yang ditempa dengan puasa dan doa; getarannya menyelaraskan elemen air di dalam tubuh manusia dengan gravitasi bulan purnama.',
        benefits: 'Pelepasan stres mendalam, pemulihan kualitas tidur, harmonisasi detak jantung, dan pembukaan jalur energi menuju meditasi puncak.',
        preparation: 'Peserta dapat duduk bersila di atas alas meditasi atau berbaring rileks sambil memejamkan mata dan menyelimuti bahu dengan selendang tenun.',
        mainImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=85',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=85'
        ]),
        status: 'Published',
        updatedAt: now
      },
      {
        id: 'ACT-05',
        stageNumber: 5,
        title: 'Samadhi Chakra Mandhala',
        subtitle: 'Meditasi Puncak Keheningan di Bawah Titik Zenit Purnama Oktober',
        scheduleTime: '21.45 – 23.15 WIB',
        duration: '90 Menit',
        location: 'Lingkar Sakral Pusat Mandala Borobudur',
        mentor: 'Bhikkhu Dhammasubho Mahathera & Pembimbing Chakra Mandala',
        badge: 'Tahap V • Puncak Penyatuan Kesadaran',
        shortDesc: 'Saat bulan purnama berada tepat di titik tertinggi di atas stupa induk Borobudur, 500 jiwa menyatu dalam keheningan Samadhi dan doa perdamaian.',
        fullDesc: 'Tahap pamungkas dan paling sakral dari seluruh rangkaian Jantra Purnama 2026. Setelah akal budi tercerahkan oleh relief, raga selaras lewat pradaksina, rasa tergetar oleh tari Solah Bowo, dan batin ditenangkan oleh gamelan, peserta memasuki Samadhi Chakra Mandhala. Di bawah mandi cahaya perak purnama penuh tanggal 26 Oktober 2026, peserta dipandu mengaktifkan tujuh titik kesadaran batin dan memancarkan Metta (cinta kasih semesta).',
        philosophy: 'Arupadhatu—alam tanpa rupa di puncak Borobudur—adalah lambang kemerdekaan batin tertinggi di mana ego lebur ke dalam kesadaran murni.',
        benefits: 'Kejernihan batin jangka panjang, ketenangan emosional mendalam, pembaruan energi spiritual, dan rasa syukur yang utuh.',
        preparation: 'Duduk dalam postur Padmasana atau Siddhasana yang tegak namun rileks, menjaga napas alami, dan menutup sesi dengan penyalaan 500 lentera doa.',
        mainImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=85',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=85'
        ]),
        status: 'Published',
        updatedAt: now
      }
    ];
    insertManyRows_('Activities', defaultActivities);
  }

  // 4. Speakers
  if (getSheetRows_('Speakers').length === 0) {
    const defaultSpeakers = [
      {
        id: 'SPK-01',
        name: 'Goenawan A. Sambodo, S.S., M.T.',
        role: 'Narasumber Utama & Kurator Epigrafi Borobudur',
        credentials: 'Pakar Sejarah Kuno Nusantara, Epigrafer Prasasti Jawa Kuno & Peneliti Mandala',
        topic: 'Membaca Kitab Batu Borobudur: Kosmologi Relief Karmawibhangga & Lalitavistara',
        bio: 'Goenawan A. Sambodo, S.S., M.T. adalah peneliti sejarah kuno, ahli epigrafi (prasasti Nusantara), dan pendidik budaya yang telah mendedikasikan lebih dari dua dekade untuk membedah naskah serta relief candi-candi Jawa Tengah dan Jawa Timur. Dalam Jantra Purnama 2026, beliau memandu langsung pembacaan relief secara kontekstual dan filosofis.',
        quote: 'Borobudur bukanlah tumpukan batu masa silam; ia adalah yantra raksasa yang dirancang leluhur agar manusia modern menemukan kembali jalan pulang menuju keheningan batinnya.',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        instagram: '@goenawansambodo',
        linkedin: 'goenawan-sambodo',
        isMain: true,
        orderNum: 1,
        status: 'Active',
        updatedAt: now
      },
      {
        id: 'SPK-02',
        name: 'Kanjeng Nyai Retno Kusumo, M.Sn.',
        role: 'Maestro Koreografi Tari Sakral Solah Bowo',
        credentials: 'Empu Tari Klasik Mataram & Peneliti Rekonstruksi Tari Relief Candi',
        topic: 'Solah Bowo: Menghidupkan Gerak Sakral Relief Borobudur di Bawah Sinar Purnama',
        bio: 'Maestro tari klasik Jawa yang telah tampil di berbagai panggung kebudayaan dunia. Beliau merekonstruksi mudra dan postur tari dari relief Lalitavistara menjadi repertoar sakral Solah Bowo.',
        quote: 'Ketika kaki penari menyentuh pelataran Borobudur di malam purnama, setiap gerak tangan adalah doa yang terlihat oleh mata.',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
        instagram: '@retnokusumo.dance',
        linkedin: 'retno-kusumo',
        isMain: false,
        orderNum: 2,
        status: 'Active',
        updatedAt: now
      },
      {
        id: 'SPK-03',
        name: 'Ki Raharjo Pangarsa',
        role: 'Komposer & Maestro Sound Healing Gamelan',
        credentials: 'Pendiri Padepokan Gangsa Husada & Praktisi Akustik Perunggu Kuno',
        topic: 'Terapi Frekuensi Gamelan 432Hz: Resonansi Gangsa untuk Penyelarasan Cakra',
        bio: 'Memadukan ilmu karawitan keraton dengan terapi frekuensi gelombang otak untuk menghadirkan pengalaman sound healing Nusantara yang autentik.',
        quote: 'Gema gong ageng di malam purnama mampu menjangkau ruang batin yang tidak bisa disentuh oleh kata-kata.',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
        instagram: '@raharjogamelan',
        linkedin: 'raharjo-pangarsa',
        isMain: false,
        orderNum: 3,
        status: 'Active',
        updatedAt: now
      }
    ];
    insertManyRows_('Speakers', defaultSpeakers);
  }

  // 5. Tickets & Payments Initial Realistic Data
  if (getSheetRows_('Tickets').length === 0) {
    const sampleTickets = [
      {
        id: 'TKT-1001',
        ticketCode: 'JP26-VIP-1001',
        fullName: 'Dr. Prabu Wijaya Kusuma',
        email: 'prabu.wijaya@nusantara.id',
        phone: '6281234567801',
        age: 42,
        city: 'Jakarta Selatan',
        category: 'VIP',
        price: 7500000,
        quantity: 2,
        totalAmount: 15000000,
        bankChoice: 'Bank Mandiri',
        paymentStatus: 'Paid',
        ticketStatus: 'Confirmed',
        notes: 'Mohon kursi VIP berdampingan di Ring-1 Solah Bowo.',
        checkInTime: '',
        createdAt: '2026-10-08T09:15:00.000Z',
        updatedAt: '2026-10-08T10:00:00.000Z'
      },
      {
        id: 'TKT-1002',
        ticketCode: 'JP26-PRM-1002',
        fullName: 'Ayu Lestari Ningrum',
        email: 'ayu.lestari@gmail.com',
        phone: '6281398765402',
        age: 34,
        city: 'Yogyakarta',
        category: 'Premium',
        price: 3500000,
        quantity: 1,
        totalAmount: 3500000,
        bankChoice: 'Bank BPD DIY',
        paymentStatus: 'Paid',
        ticketStatus: 'Confirmed',
        notes: 'Vegetarian untuk Royal Heritage Dinner.',
        checkInTime: '',
        createdAt: '2026-10-09T14:20:00.000Z',
        updatedAt: '2026-10-09T15:05:00.000Z'
      },
      {
        id: 'TKT-1003',
        ticketCode: 'JP26-REG-1003',
        fullName: 'Hendra Gunawan Putra',
        email: 'hendra.putra@yahoo.com',
        phone: '6285711223344',
        age: 29,
        city: 'Surabaya',
        category: 'Regular',
        price: 1500000,
        quantity: 2,
        totalAmount: 3000000,
        bankChoice: 'Bank Mandiri',
        paymentStatus: 'Paid',
        ticketStatus: 'Confirmed',
        notes: 'Hadir bersama pasangan.',
        checkInTime: '',
        createdAt: '2026-10-10T11:30:00.000Z',
        updatedAt: '2026-10-10T12:15:00.000Z'
      },
      {
        id: 'TKT-1004',
        ticketCode: 'JP26-PRM-1004',
        fullName: 'Dewi Saraswati Handayani',
        email: 'dewi.saraswati@outlook.com',
        phone: '6281122334455',
        age: 38,
        city: 'Bandung',
        category: 'Premium',
        price: 3500000,
        quantity: 2,
        totalAmount: 7000000,
        bankChoice: 'Bank BPD DIY',
        paymentStatus: 'Pending',
        ticketStatus: 'Pending',
        notes: 'Sudah transfer via mobile banking BPD DIY, menunggu verifikasi.',
        checkInTime: '',
        createdAt: '2026-10-12T06:45:00.000Z',
        updatedAt: '2026-10-12T06:45:00.000Z'
      }
    ];
    insertManyRows_('Tickets', sampleTickets);

    const samplePayments = [
      {
        id: 'PAY-2001',
        paymentCode: 'INV-JP26-1001',
        ticketCode: 'JP26-VIP-1001',
        fullName: 'Dr. Prabu Wijaya Kusuma',
        email: 'prabu.wijaya@nusantara.id',
        phone: '6281234567801',
        bankName: 'Bank Mandiri',
        accountSender: 'Mandiri - Prabu Wijaya Kusuma (12000987123)',
        amount: 15000000,
        proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
        status: 'Verified',
        verifiedBy: 'Ki Ageng Suryo (Super Admin)',
        verifiedAt: '2026-10-08T10:00:00.000Z',
        notes: 'Transfer penuh lunas terverifikasi mutasi Mandiri.',
        createdAt: '2026-10-08T09:20:00.000Z',
        updatedAt: '2026-10-08T10:00:00.000Z'
      },
      {
        id: 'PAY-2002',
        paymentCode: 'INV-JP26-1002',
        ticketCode: 'JP26-PRM-1002',
        fullName: 'Ayu Lestari Ningrum',
        email: 'ayu.lestari@gmail.com',
        phone: '6281398765402',
        bankName: 'Bank BPD DIY',
        accountSender: 'BPD DIY - Ayu Lestari N (0012938412)',
        amount: 3500000,
        proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
        status: 'Verified',
        verifiedBy: 'Bagas Pramudya (Front Office)',
        verifiedAt: '2026-10-09T15:05:00.000Z',
        notes: 'Mutasi BPD DIY sesuai nominal.',
        createdAt: '2026-10-09T14:30:00.000Z',
        updatedAt: '2026-10-09T15:05:00.000Z'
      },
      {
        id: 'PAY-2003',
        paymentCode: 'INV-JP26-1003',
        ticketCode: 'JP26-REG-1003',
        fullName: 'Hendra Gunawan Putra',
        email: 'hendra.putra@yahoo.com',
        phone: '6285711223344',
        bankName: 'Bank Mandiri',
        accountSender: 'Mandiri - Hendra Gunawan (14200991122)',
        amount: 3000000,
        proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
        status: 'Verified',
        verifiedBy: 'Bagas Pramudya (Front Office)',
        verifiedAt: '2026-10-10T12:15:00.000Z',
        notes: 'Lunas 2 tiket Regular.',
        createdAt: '2026-10-10T11:40:00.000Z',
        updatedAt: '2026-10-10T12:15:00.000Z'
      },
      {
        id: 'PAY-2004',
        paymentCode: 'INV-JP26-1004',
        ticketCode: 'JP26-PRM-1004',
        fullName: 'Dewi Saraswati Handayani',
        email: 'dewi.saraswati@outlook.com',
        phone: '6281122334455',
        bankName: 'Bank BPD DIY',
        accountSender: 'BPD DIY - Dewi Saraswati (0048827162)',
        amount: 7000000,
        proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
        status: 'Pending',
        verifiedBy: '',
        verifiedAt: '',
        notes: 'Menunggu pengecekan rekening koran pagi ini.',
        createdAt: '2026-10-12T06:50:00.000Z',
        updatedAt: '2026-10-12T06:50:00.000Z'
      }
    ];
    insertManyRows_('Payments', samplePayments);
  }
}

/**
 * ============================================================================
 * 3. CORE BUSINESS LOGIC & HANDLERS
 * ============================================================================
 */

function getPublicPayload_() {
  const settingsRows = getSheetRows_('Settings');
  const settingsMap = {};
  settingsRows.forEach(function(r) {
    settingsMap[r.key] = r.value;
  });

  const tickets = getSheetRows_('Tickets');
  const quotaSummary = computeQuotaSummary_(tickets, settingsMap);

  return {
    settings: settingsMap,
    quota: quotaSummary,
    activities: getSheetRows_('Activities').filter(function(a) { return a.status !== 'Archived'; }),
    speakers: getSheetRows_('Speakers').filter(function(s) { return s.status === 'Active'; }),
    gallery: getSheetRows_('Gallery'),
    testimonials: getSheetRows_('Testimonials').filter(function(t) { return t.status === 'Approved'; }),
    faqs: getSheetRows_('FAQs').filter(function(f) { return f.status === 'Published'; }),
    articles: getSheetRows_('Articles').filter(function(ar) { return ar.status === 'Published'; })
  };
}

function getFullDatabaseSnapshot_() {
  const snapshot = {};
  Object.keys(SHEET_SCHEMAS).forEach(function(sheetName) {
    snapshot[sheetName] = getSheetRows_(sheetName);
  });
  return snapshot;
}

function computeQuotaSummary_(tickets, settingsMap) {
  const totalQuota = Number(settingsMap.totalQuota || 500);
  const tierQuotas = {
    Regular: Number(settingsMap.quotaRegular || 300),
    Premium: Number(settingsMap.quotaPremium || 150),
    VIP: Number(settingsMap.quotaVIP || 50)
  };
  const soldByTier = { Regular: 0, Premium: 0, VIP: 0 };
  let totalSold = 0;
  let totalRevenue = 0;

  tickets.forEach(function(t) {
    if (t.ticketStatus !== 'Cancelled') {
      const qty = Number(t.quantity || 1);
      const cat = t.category || 'Regular';
      soldByTier[cat] = (soldByTier[cat] || 0) + qty;
      totalSold += qty;
      if (t.paymentStatus === 'Paid') {
        totalRevenue += Number(t.totalAmount || 0);
      }
    }
  });

  return {
    totalQuota: totalQuota,
    totalSold: totalSold,
    remainingQuota: Math.max(0, totalQuota - totalSold),
    totalRevenue: totalRevenue,
    tiers: {
      Regular: { quota: tierQuotas.Regular, sold: soldByTier.Regular, remaining: Math.max(0, tierQuotas.Regular - soldByTier.Regular) },
      Premium: { quota: tierQuotas.Premium, sold: soldByTier.Premium, remaining: Math.max(0, tierQuotas.Premium - soldByTier.Premium) },
      VIP: { quota: tierQuotas.VIP, sold: soldByTier.VIP, remaining: Math.max(0, tierQuotas.VIP - soldByTier.VIP) }
    }
  };
}

function handleLogin_(body) {
  const identifier = String(body.username || body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const users = getSheetRows_('Users');

  const user = users.find(function(u) {
    return (
      String(u.username || '').toLowerCase() === identifier ||
      String(u.email || '').toLowerCase() === identifier
    );
  });

  if (!user) {
    return { ok: false, error: 'Akun pengguna tidak ditemukan.' };
  }
  if (user.status !== 'Active') {
    return { ok: false, error: 'Akun pengguna sedang dinonaktifkan.' };
  }

  const computedHash = hashPassword_(password, user.salt || '');
  if (computedHash !== user.passwordHash && password !== user.passwordHash) {
    logAudit_(identifier, 'Unknown', 'LOGIN_FAILED', 'Users', user.id, 'Percobaan login gagal (password salah)');
    return { ok: false, error: 'Kata sandi yang Anda masukkan tidak sesuai.' };
  }

  const now = new Date().toISOString();
  updateRowById_('Users', 'id', user.id, { lastLogin: now });
  const token = generateSessionToken_(user);

  logAudit_(user.fullName, user.role, 'LOGIN_SUCCESS', 'Users', user.id, 'Login berhasil ke CMS Jantra Purnama 2026');

  return {
    ok: true,
    token: token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      lastLogin: now
    }
  };
}

function handleBookTicket_(body) {
  const age = Number(body.age || 0);
  if (age < 15) {
    return { ok: false, error: 'Mohon maaf, usia minimal peserta Jantra Purnama 2026 adalah 15 tahun.' };
  }

  const now = new Date().toISOString();
  const category = body.category || 'Regular';
  const prices = { Regular: 1500000, Premium: 3500000, VIP: 7500000 };
  const price = Number(body.price || prices[category] || 1500000);
  const quantity = Math.max(1, Number(body.quantity || 1));
  const totalAmount = Number(body.totalAmount || (price * quantity));
  const prefix = category === 'VIP' ? 'VIP' : (category === 'Premium' ? 'PRM' : 'REG');
  const randCode = Math.floor(1000 + Math.random() * 9000);
  const ticketCode = body.ticketCode || ('JP26-' + prefix + '-' + randCode);
  const ticketId = body.id || ('TKT-' + randCode);
  const paymentId = 'PAY-' + randCode;
  const paymentCode = 'INV-JP26-' + randCode;

  const ticketRow = {
    id: ticketId,
    ticketCode: ticketCode,
    fullName: body.fullName || '',
    email: body.email || '',
    phone: body.phone || '',
    age: age,
    city: body.city || '',
    category: category,
    price: price,
    quantity: quantity,
    totalAmount: totalAmount,
    bankChoice: body.bankChoice || 'Bank Mandiri',
    paymentStatus: 'Pending',
    ticketStatus: 'Pending',
    notes: body.notes || '',
    checkInTime: '',
    createdAt: now,
    updatedAt: now
  };

  const paymentRow = {
    id: paymentId,
    paymentCode: paymentCode,
    ticketCode: ticketCode,
    fullName: ticketRow.fullName,
    email: ticketRow.email,
    phone: ticketRow.phone,
    bankName: ticketRow.bankChoice,
    accountSender: body.accountSender || ('Menunggu Konfirmasi - ' + ticketRow.fullName),
    amount: totalAmount,
    proofUrl: body.proofUrl || '',
    status: 'Pending',
    verifiedBy: '',
    verifiedAt: '',
    notes: body.notes || 'Pemesanan baru dari Landing Page Publik',
    createdAt: now,
    updatedAt: now
  };

  insertRow_('Tickets', ticketRow);
  insertRow_('Payments', paymentRow);
  logAudit_(ticketRow.fullName, 'Public Participant', 'BOOK_TICKET', 'Tickets', ticketCode, 'Pemesanan ' + quantity + ' tiket ' + category + ' senilai Rp' + totalAmount);

  return {
    ok: true,
    message: 'Pemesanan tiket berhasil dicatat.',
    ticket: ticketRow,
    payment: paymentRow
  };
}

function handleTicketLookup_(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return { ok: false, error: 'Masukkan kode tiket atau alamat email Anda.' };
  }

  const tickets = getSheetRows_('Tickets');
  const payments = getSheetRows_('Payments');

  const matchedTickets = tickets.filter(function(t) {
    return (
      String(t.ticketCode || '').toLowerCase() === q ||
      String(t.email || '').toLowerCase() === q ||
      String(t.phone || '').toLowerCase() === q
    );
  });

  if (matchedTickets.length === 0) {
    return { ok: false, error: 'Data pesanan tidak ditemukan untuk kode/email tersebut.' };
  }

  const enriched = matchedTickets.map(function(t) {
    const pay = payments.find(function(p) { return p.ticketCode === t.ticketCode; }) || null;
    return { ticket: t, payment: pay };
  });

  return {
    ok: true,
    results: enriched
  };
}

function handleConfirmPayment_(body) {
  const ticketCode = String(body.ticketCode || '').trim();
  const now = new Date().toISOString();

  const updatedPayment = updateRowById_('Payments', 'ticketCode', ticketCode, {
    bankName: body.bankName || 'Bank Mandiri',
    accountSender: body.accountSender || '',
    proofUrl: body.proofUrl || '',
    notes: body.notes || 'Bukti pembayaran dikirim oleh peserta melalui fitur Cek Tiket',
    updatedAt: now
  });

  if (!updatedPayment) {
    return { ok: false, error: 'Data pembayaran untuk kode tiket ' + ticketCode + ' tidak ditemukan.' };
  }

  logAudit_(body.accountSender || ticketCode, 'Public Participant', 'CONFIRM_PAYMENT', 'Payments', ticketCode, 'Konfirmasi transfer bank dikirim oleh peserta');

  return {
    ok: true,
    message: 'Konfirmasi pembayaran berhasil dikirim dan sedang diverifikasi tim Front Office.',
    payment: updatedPayment
  };
}

function handleVerifyPayment_(body) {
  const ticketCode = body.ticketCode;
  const newStatus = body.status || 'Verified'; // Verified | Rejected | Pending
  const actor = body.actor || 'Admin CMS';
  const role = body.role || 'Front Office';
  const now = new Date().toISOString();

  const paymentUpdate = {
    status: newStatus,
    verifiedBy: actor,
    verifiedAt: now,
    notes: body.notes || ('Diverifikasi sebagai ' + newStatus + ' oleh ' + actor),
    updatedAt: now
  };
  updateRowById_('Payments', 'ticketCode', ticketCode, paymentUpdate);

  const ticketPaymentStatus = newStatus === 'Verified' ? 'Paid' : (newStatus === 'Rejected' ? 'Rejected' : 'Pending');
  const ticketStatus = newStatus === 'Verified' ? 'Confirmed' : (newStatus === 'Rejected' ? 'Cancelled' : 'Pending');

  const updatedTicket = updateRowById_('Tickets', 'ticketCode', ticketCode, {
    paymentStatus: ticketPaymentStatus,
    ticketStatus: ticketStatus,
    updatedAt: now
  });

  logAudit_(actor, role, 'VERIFY_PAYMENT', 'Payments', ticketCode, 'Status pembayaran diubah menjadi ' + newStatus);

  return {
    ok: true,
    message: 'Status pembayaran & tiket ' + ticketCode + ' berhasil diperbarui menjadi ' + newStatus,
    ticket: updatedTicket
  };
}

function handleCheckInTicket_(body) {
  const ticketCode = String(body.ticketCode || '').trim();
  const actor = body.actor || 'Front Office';
  const role = body.role || 'Front Office';
  const now = new Date().toISOString();

  const updated = updateRowById_('Tickets', 'ticketCode', ticketCode, {
    ticketStatus: 'Checked-In',
    checkInTime: now,
    updatedAt: now
  });

  if (!updated) {
    return { ok: false, error: 'Kode tiket ' + ticketCode + ' tidak ditemukan.' };
  }

  logAudit_(actor, role, 'CHECKIN_TICKET', 'Tickets', ticketCode, 'Peserta berhasil Check-In di Gerbang Borobudur');
  return {
    ok: true,
    message: 'Check-In berhasil untuk ' + updated.fullName + ' (' + ticketCode + ')',
    ticket: updated
  };
}

function handleSubmitContact_(body) {
  const now = new Date().toISOString();
  const row = {
    id: 'MSG-' + Math.floor(1000 + Math.random() * 9000),
    name: body.name || '',
    email: body.email || '',
    phone: body.phone || '',
    subject: body.subject || 'Pertanyaan Umum Jantra Purnama 2026',
    message: body.message || '',
    status: 'Unread',
    repliedBy: '',
    createdAt: now,
    updatedAt: now
  };
  insertRow_('Messages', row);
  logAudit_(row.name, 'Public Visitor', 'SUBMIT_MESSAGE', 'Messages', row.id, 'Pesan kontak masuk: ' + row.subject);
  return { ok: true, message: 'Pesan Anda telah diterima oleh Sekretariat Yayasan Chakra Mandala Nusantara.', data: row };
}

function handleSubscribeNewsletter_(body) {
  const now = new Date().toISOString();
  const row = {
    id: 'SUB-' + Math.floor(1000 + Math.random() * 9000),
    email: body.email || '',
    name: body.name || 'Sahabat Purnama',
    source: body.source || 'Landing Page Footer',
    status: 'Active',
    subscribedAt: now
  };
  insertRow_('Subscribers', row);
  logAudit_(row.email, 'Public Visitor', 'SUBSCRIBE_NEWSLETTER', 'Subscribers', row.id, 'Pendaftaran newsletter baru');
  return { ok: true, message: 'Terima kasih telah bergabung dalam Lingkar Warta Jantra Purnama 2026.', data: row };
}

function handleSubmitTestimonial_(body) {
  const now = new Date().toISOString();
  const row = {
    id: 'TST-' + Math.floor(1000 + Math.random() * 9000),
    name: body.name || '',
    role: body.role || 'Peserta Jantra Purnama',
    city: body.city || 'Indonesia',
    ticketCategory: body.ticketCategory || 'Premium',
    rating: Number(body.rating || 5),
    comment: body.comment || '',
    avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    eventYear: body.eventYear || '2025',
    status: 'Pending',
    isFeatured: false,
    createdAt: now
  };
  insertRow_('Testimonials', row);
  logAudit_(row.name, 'Public Visitor', 'SUBMIT_TESTIMONIAL', 'Testimonials', row.id, 'Testimoni baru menunggu moderasi');
  return { ok: true, message: 'Terima kasih! Testimoni Anda telah dikirim dan menunggu moderasi kurator.', data: row };
}

/**
 * ============================================================================
 * 4. GENERIC CRUD HANDLERS FOR ALL 13 SHEETS
 * ============================================================================
 */

function handleCrudCreate_(body) {
  const sheetName = body.sheet;
  if (!SHEET_SCHEMAS[sheetName]) {
    return { ok: false, error: 'Nama sheet tidak valid: ' + sheetName };
  }
  const record = body.record || {};
  const now = new Date().toISOString();
  if (!record.id && SHEET_SCHEMAS[sheetName].indexOf('id') !== -1) {
    record.id = sheetName.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
  }
  if (SHEET_SCHEMAS[sheetName].indexOf('createdAt') !== -1 && !record.createdAt) {
    record.createdAt = now;
  }
  if (SHEET_SCHEMAS[sheetName].indexOf('updatedAt') !== -1) {
    record.updatedAt = now;
  }

  insertRow_(sheetName, record);
  logAudit_(body.actor || 'Admin CMS', body.role || 'Super Admin', 'CREATE', sheetName, record.id || record.key || '-', 'Menambahkan data baru pada ' + sheetName);
  return { ok: true, sheet: sheetName, record: record };
}

function handleCrudUpdate_(body) {
  const sheetName = body.sheet;
  if (!SHEET_SCHEMAS[sheetName]) {
    return { ok: false, error: 'Nama sheet tidak valid: ' + sheetName };
  }
  const keyField = body.keyField || (sheetName === 'Settings' ? 'key' : 'id');
  const keyValue = body.keyValue || (body.record ? body.record[keyField] : '');
  const updates = body.record || {};
  if (SHEET_SCHEMAS[sheetName].indexOf('updatedAt') !== -1) {
    updates.updatedAt = new Date().toISOString();
  }

  const updated = updateRowById_(sheetName, keyField, keyValue, updates);
  if (!updated) {
    return { ok: false, error: 'Data tidak ditemukan pada ' + sheetName + ' (' + keyValue + ')' };
  }
  logAudit_(body.actor || 'Admin CMS', body.role || 'Super Admin', 'UPDATE', sheetName, String(keyValue), 'Memperbarui data pada ' + sheetName);
  return { ok: true, sheet: sheetName, record: updated };
}

function handleCrudDelete_(body) {
  const sheetName = body.sheet;
  if (!SHEET_SCHEMAS[sheetName]) {
    return { ok: false, error: 'Nama sheet tidak valid: ' + sheetName };
  }
  const keyField = body.keyField || (sheetName === 'Settings' ? 'key' : 'id');
  const keyValue = body.keyValue;

  const deleted = deleteRowById_(sheetName, keyField, keyValue);
  if (!deleted) {
    return { ok: false, error: 'Data yang akan dihapus tidak ditemukan.' };
  }
  logAudit_(body.actor || 'Admin CMS', body.role || 'Super Admin', 'DELETE', sheetName, String(keyValue), 'Menghapus data dari ' + sheetName);
  return { ok: true, sheet: sheetName, deletedId: keyValue };
}

function handleSaveSettings_(body) {
  const settingsObj = body.settings || {};
  const now = new Date().toISOString();
  Object.keys(settingsObj).forEach(function(k) {
    const updated = updateRowById_('Settings', 'key', k, {
      value: String(settingsObj[k]),
      updatedAt: now
    });
    if (!updated) {
      insertRow_('Settings', {
        key: k,
        value: String(settingsObj[k]),
        label: k,
        category: 'Custom',
        updatedAt: now
      });
    }
  });
  logAudit_(body.actor || 'Admin CMS', body.role || 'Super Admin', 'UPDATE_SETTINGS', 'Settings', 'GLOBAL', 'Memperbarui konfigurasi global situs & event');
  return { ok: true, message: 'Pengaturan global berhasil disimpan ke Google Spreadsheet.' };
}

function handleSyncAll_(body) {
  const payload = body.database || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_SCHEMAS).forEach(function(sheetName) {
    if (Array.isArray(payload[sheetName])) {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        sheet.clearContents();
        const headers = SHEET_SCHEMAS[sheetName];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        if (payload[sheetName].length > 0) {
          insertManyRows_(sheetName, payload[sheetName]);
        }
      }
    }
  });

  logAudit_(body.actor || 'Admin CMS', body.role || 'Super Admin', 'SYNC_ALL', 'System', 'ALL_13_SHEETS', 'Sinkronisasi penuh database 13 sheet dari aplikasi web');
  return {
    ok: true,
    message: 'Seluruh 13 sheet berhasil disinkronkan dengan Google Spreadsheet.',
    data: getFullDatabaseSnapshot_()
  };
}

/**
 * ============================================================================
 * 5. LOW-LEVEL SPREADSHEET & CRYPTO HELPERS
 * ============================================================================
 */

function getSheetRows_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function insertRow_(sheetName, record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = SHEET_SCHEMAS[sheetName];
  const rowValues = headers.map(function(h) {
    const val = record[h];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });
  sheet.appendRow(rowValues);
  return record;
}

function insertManyRows_(sheetName, records) {
  if (!records || records.length === 0) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = SHEET_SCHEMAS[sheetName];
  const matrix = records.map(function(rec) {
    return headers.map(function(h) {
      const val = rec[h];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
  });
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, matrix.length, headers.length).setValues(matrix);
}

function updateRowById_(sheetName, keyField, keyValue, updates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      const updatedObj = {};
      for (let j = 0; j < headers.length; j++) {
        const colName = headers[j];
        if (Object.prototype.hasOwnProperty.call(updates, colName)) {
          data[i][j] = typeof updates[colName] === 'object' && updates[colName] !== null
            ? JSON.stringify(updates[colName])
            : updates[colName];
        }
        updatedObj[colName] = data[i][j];
      }
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      return updatedObj;
    }
  }
  return null;
}

function deleteRowById_(sheetName, keyField, keyValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return false;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) return false;

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function hashPassword_(plainPassword, salt) {
  const raw = String(plainPassword) + '::' + String(salt);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function generateSessionToken_(user) {
  const payload = {
    sub: user.id,
    usr: user.username,
    role: user.role,
    exp: Date.now() + (APP_CONFIG.TOKEN_TTL_HOURS * 3600 * 1000),
    nonce: Utilities.getUuid()
  };
  return Utilities.base64EncodeWebSafe(JSON.stringify(payload));
}

function logAudit_(actor, role, action, moduleName, targetId, details) {
  try {
    const row = {
      id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
      actor: actor || 'System',
      role: role || 'System',
      action: action || 'INFO',
      module: moduleName || 'General',
      targetId: targetId || '-',
      details: details || '',
      ipInfo: 'GAS-WebApp'
    };
    insertRow_('AuditLog', row);
  } catch (ignore) {
    // Jangan gagalkan transaksi utama bila audit log gagal ditulis
  }
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(message, code) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      code: code || 400,
      error: message
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
