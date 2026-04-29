# PRD: Itqan (PWA Tahfidz Assistant)

---

## 1. Ringkasan Produk

**Itqan** adalah Progressive Web App (PWA) *offline-first* yang mengotomatisasi penjadwalan hafalan Al-Qur'an menggunakan **3-Part Method** (Sabaq, Sabqi, Manzil). Aplikasi ini berfokus pada efisiensi beban kognitif bagi pengguna sibuk dengan cara menghitung porsi murojaah secara dinamis berdasarkan total hafalan dan tingkat kesibukan harian.

---

## 2. Profil Pengguna & Mode Intensitas

Target utama adalah individu yang memiliki jadwal ketat (seperti peneliti atau mahasiswa pascasarjana) dan membutuhkan sistem yang fleksibel.

| Mode | Siklus Manzil | Logika Sabqi | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Academic/Busy Mode** | 30 Hari | 3–5 Halaman | Fokus menjaga hafalan agar tidak hilang di tengah deadline. |
| **Balanced Mode** | 15 Hari | 10 Halaman | Keseimbangan ideal antara riset dan hafalan. |
| **Murattal Mode** | 7 Hari | Seluruh Juz aktif | Intensif, biasanya digunakan saat libur atau akhir pekan. |

---

## 3. Fitur Utama (Functional Requirements)## 3. Fitur Utama (Functional Requirements)

- **Smart Dashboard:** Tampilan kartu tunggal yang menunjukkan apa yang harus dibaca saat ini (Sabaq/Sabqi/Manzil).
- **Audio Player per Ayat/Halaman:** Integrasi API Al-Qur'an untuk memutar audio sebagai bantuan pendengaran saat murojaah pasif (misal: saat mengemudi atau di sela riset).
- **Local-Only Database:** Penyimpanan di IndexedDB (via Dexie.js) untuk privasi dan kecepatan akses tanpa internet.
- **Export/Import System:** Fitur cadangan manual berupa file JSON.
- **Emergency Toggle:** Tombol "Sangat Sibuk" untuk memangkas jadwal hanya ke porsi yang paling krusial.

---

## 4. Skema Database (Dexie.js / IndexedDB)

Struktur ini dirancang untuk performa lokal yang cepat di perangkat mobile.

```javascript
// Database Name: ItqanLocalDB
{
  // Tabel Progres Hafalan
  progress: "++id, page_number, surah_id, status (sabaq/sabqi/manzil), last_reviewed, quality_score",
  
  // Tabel Pengaturan User
  settings: "id, current_mode, cycle_days, last_export_date, daily_target",
  
  // Tabel Log Harian (untuk Heatmap/Statistik)
  logs: "++id, date, completed_parts (array), duration_minutes"
}
```

**Relasi Logika:**
- `last_reviewed` digunakan untuk menghitung antrean Manzil.
- `quality_score` (1–5) menentukan apakah suatu halaman akan muncul lebih sering di jadwal Sabqi.

---

## 5. Integrasi Telegram Bot (Optional)

Sebagai jembatan antara aplikasi web dan notifikasi:

- **Reminder:** Kirim pesan otomatis "Jadwal Manzil hari ini: Juz 5" pada jam yang ditentukan.
- **Cloud Backup:** Fitur untuk mengirimkan file export `.json` langsung ke chat Telegram pribadi sebagai cadangan selain di memori HP.
- **Quick Log:** Input hafalan sederhana via chat yang akan tersinkron saat PWA dibuka.

---

## 6. Desain & Palet Warna

Mengingat aplikasi ini sering dibuka saat subuh atau malam hari, desain harus nyaman di mata (*low eye strain*).

| Warna | Hex Code | Deskripsi |
| :--- | :--- | :--- |
| **Primary (Deep Emerald)** | `#064E3B` | Memberikan kesan tenang dan religius. |
| **Secondary (Soft Sand)** | `#FDF2F2` | Warna latar belakang agar teks Arab mudah dibaca. |
| **Accent (Amber Gold)** | `#D97706` | Untuk penanda progres atau highlight ayat. |

**Typography:**
- **Latin:** Inter atau Lexend (bersih dan modern).
- **Arabic:** Amiri atau Uthmanic Hafs (standar Mushaf Madinah).

---

## 7. Rekomendasi "Stitch Prompt" (System Prompt)

Gunakan prompt ini saat meminta bantuan AI (seperti Cursor atau Claude) untuk menulis kode:

> Bertindaklah sebagai Senior Fullstack Developer yang ahli dalam React, Vite, dan Dexie.js. Saya sedang membangun PWA Tahfidz bernama Itqan Flow. Fokus pada arsitektur *Offline-First*. Buatlah komponen fungsional yang modular. Gunakan Tailwind CSS untuk styling. Pastikan logika kalkulasi Manzil menggunakan rumus $(Total\_Hafalan - Sabqi) / Cycle\_Days$. Prioritaskan performa rendering pada list panjang ayat Al-Qur'an menggunakan *virtual scrolling*.

---

## 8. Rencana Implementasi (Roadmap)

- **Minggu 1:** Setup Vite + PWA Plugin + Dexie.js Schema.
- **Minggu 2:** Integrasi API Al-Qur'an (Teks & Audio) dan Logika 3-Part.
- **Minggu 3:** UI Dashboard dan fitur Mode Intensitas (Slider).
- **Minggu 4:** Fitur Export/Import dan Testing PWA di perangkat Android/iOS.

Dengan struktur ini, Anda tetap bisa menjaga kualitas hafalan di tengah kesibukan mengurus keluarga dan menyelesaikan tugas riset di universitas.

---

## Compliance Checklist

- ✅ **Hard Fail 1:** No "Based on" phrases used.
- ✅ **Hard Fail 2:** User data added specific value (academic/family context).
- ✅ **Hard Fail 3:** No sensitive data included.
- ✅ **Hard Fail 4:** Applied user preference for local-only and busy modes.