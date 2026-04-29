# Itqan - UI/UX & System Design Document

## 1. Overview
**Itqan Flow** adalah Progressive Web App (PWA) berbasis *offline-first* yang dirancang khusus untuk memfasilitasi hafalan Al-Qur'an bagi individu dengan jadwal padat. Aplikasi ini menggunakan metode 3-Part (Sabaq, Sabqi, Manzil) dengan algoritma penjadwalan dinamis yang menyesuaikan dengan tingkat kesibukan pengguna.

---

## 2. Design System

### 2.1 Color Palette
Aplikasi didesain dengan warna yang menenangkan (*low eye strain*) agar nyaman digunakan pada pagi buta (Subuh) atau malam hari.

| Role | Color Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | Deep Emerald | `#064E3B` | Header, Bottom Navigation, Primary Buttons. |
| **Secondary** | Soft Sand | `#FDF2F2` | Background untuk area teks ayat/halaman. |
| **Accent** | Amber Gold | `#D97706` | Highlight ayat aktif, Progress Bar, Active State. |
| **Background** | Slate Light | `#F8FAFC` | Latar belakang utama aplikasi (Dashboard). |
| **Text Dark** | Slate Gray | `#1E293B` | Teks utama UI (Latin). |
| **Text Muted** | Cool Gray | `#64748B` | Subtitle, deskripsi, placeholder. |

### 2.2 Typography
* **UI Text (Latin):** `Inter` atau `Lexend`. Digunakan untuk menu, dashboard, dan pengaturan karena keterbacaannya yang tinggi pada ukuran layar kecil.
* **Quranic Text (Arabic):** `KFGQPC Uthmanic Script HAFS` atau `Amiri`. Mutlak diperlukan agar tajwid dan harakat terlihat jelas dan proporsional.

---

## 3. Information Architecture (Mobile-First Layout)

Aplikasi menggunakan struktur navigasi bawah (Bottom Navigation) untuk mempercepat perpindahan antar layar.

### 3.1 Layar 1: Dashboard (Tampilan Utama)
Fokus pada tugas hari ini. Didesain agar pengguna langsung tahu apa yang harus dilakukan dalam waktu 3 detik.
* **Header:** Menampilkan tanggal hari ini dan tombol "Emergency Mode" (icon petir/jam pasir).
* **Today's Targets (3 Cards):**
  * **Sabaq Card:** Menampilkan target halaman hafalan baru. Tombol "Mulai Menghafal".
  * **Sabqi Card:** Menampilkan rentang halaman (misal: Hal 15 - 20).
  * **Manzil Card:** Menampilkan antrean murojaah harian (misal: Juz 1).
* **Progress Heatmap:** Visualisasi kontribusi 30 hari terakhir (mirip GitHub/Habitica).

### 3.2 Layar 2: Mushaf / Reading View
Layar tempat pengguna berinteraksi dengan teks Al-Qur'an dan audio.
* **Top Bar:** Nama Surah, Halaman, dan tombol kembali.
* **Content Area:** Teks Arab dengan ukuran font yang bisa diubah. 
* **Sticky Audio Bar (Bottom):** Kontrol pemutar audio (Play, Pause, Rewind 5s, Loop).
* **Ayah Interaction:** Mengetuk ayat akan memunculkan menu *pop-up*: "Play dari sini", "Tandai Sulit (Quality Score 1-2)".

### 3.3 Layar 3: Stats & Settings
* **Intensity Slider:** Toggle untuk mengubah mode (Academic/Busy → Balanced → Murattal).
* **Data Management:**
  - Tombol `Export to JSON`
  - Tombol `Import from JSON`
* **Telegram Integration (Optional):** Input field untuk Bot Token & Chat ID untuk *cloud backup* manual.

---

## 4. Component Architecture (React/Vite)

Struktur komponen dirancang modular agar mudah dikelola dan dites secara independen.

```text
src/
├── components/
│   ├── layout/
│   │   ├── BottomNav.jsx         # Navigasi utama
│   │   ├── TopHeader.jsx         # Header dengan mode switcher
│   ├── dashboard/
│   │   ├── TaskCard.jsx          # Komponen reusable untuk Sabaq/Sabqi/Manzil
│   │   ├── ProgressHeatmap.jsx   # Grid hijau untuk tracking harian
│   ├── mushaf/
│   │   ├── QuranPage.jsx         # Menampilkan 1 halaman penuh
│   │   ├── AyahText.jsx          # Komponen teks Arab individual
│   │   ├── AudioPlayerBar.jsx    # Kontrol murattal di bawah layar
│   ├── ui/                       # Komponen generik (Button, Modal, Slider)
├── store/
│   ├── useProgressStore.js       # Zustand: State hafalan
│   ├── useSettingsStore.js       # Zustand: Tema, intensitas, konfigurasi
├── db/
│   ├── dexieConfig.js            # Inisialisasi IndexedDB schema
├── utils/
│   ├── scheduler.js              # Logika kalkulasi beban harian (3-Part)
│   ├── exportImport.js           # Logika JSON blob & file reader
```

---

## 5. Core Logic & Data Flow

### 5.1 The "Scheduler" Engine (utils/scheduler.js)

Setiap kali aplikasi dibuka pada hari yang baru, fungsi ini berjalan di background:

- Membaca `total_memorized` dari IndexedDB.
- Membaca preferensi `intensity_cycle` (30 hari, 15 hari, atau 7 hari).
- **Mengkalkulasi Sabqi:** Mengambil $x$ halaman terakhir dari total hafalan.
- **Mengkalkulasi Manzil:** Mengambil daftar halaman sisa, dibagi dengan `intensity_cycle`.
- Menampilkan hasilnya di Dashboard.

### 5.2 Emergency Mode Flow

Jika pengguna menekan tombol "Emergency Mode" (sedang sangat sibuk):

- State PWA berubah ke `isEmergency: true`.
- UI menyembunyikan kartu Sabaq dan Manzil.
- UI hanya menampilkan kartu Sabqi dengan porsi yang diperkecil (hanya 3-5 halaman terakhir yang paling rentan lupa).
- Menyelesaikan tugas ini tetap dihitung sebagai "hijau" pada Heatmap agar pengguna tidak merasa gagal.

---

## 6. PWA & Offline Strategy

### 6.1 Manifest (manifest.json)
Dikonfigurasi agar aplikasi tampil standalone (tanpa address bar browser), menyertakan icon hijau beresolusi tinggi (192×192 & 512×512).

### 6.2 Service Worker (Workbox)
- **Cache First Strategy:** Untuk aset UI (CSS, JS, Fonts, Icon).
- **Network First Strategy:** Untuk mengunduh audio murattal. Jika audio belum tersedia, aplikasi otomatis mengunduh per halaman saat pengguna menekan Play dan menyimpannya di Cache Storage.

### 6.3 Local Storage (Dexie.js / IndexedDB)
Dexie.js (IndexedDB) digunakan sebagai single source of truth untuk semua data pengguna:
- Progress & Logs
- Settings & Preferences
- Tidak ada fetching state yang menunggu respons server.
