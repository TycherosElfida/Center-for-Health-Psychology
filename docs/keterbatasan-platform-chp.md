# Keterbatasan dan Rekomendasi Pengembangan Lanjutan
## Platform Asesmen Digital — Center for Health Psychology (CHP)
## Universitas Kristen Krida Wacana (UKRIDA), Jakarta

> **Tanggal Penyusunan:** 19 Mei 2026
> **Penyusun:** Mahasiswa Kerja Praktik, Fakultas Ilmu Komputer UKRIDA
> **Diperuntukkan bagi:** Dekan Fakultas Psikologi UKRIDA
> **Status Dokumen:** Final — disusun sebagai bagian dari serah terima proyek

---

## Pengantar

Dokumen ini memaparkan secara transparan seluruh keterbatasan yang diidentifikasi selama proses pengembangan Platform Asesmen Digital CHP. Keterbatasan dibagi menjadi tiga kategori utama: (1) keterbatasan psikometri dan klinis pada instrumen yang digunakan beserta deviasi implementasinya di sistem, (2) celah integrasi antara panel admin dan antarmuka pengguna, dan (3) keterbatasan teknis serta keamanan pada sistem yang dikembangkan. Setiap keterbatasan disertai dengan rekomendasi konkret untuk pengembangan lanjutan oleh mahasiswa atau tim berikutnya.

---

## Bagian A — Keterbatasan Psikometri dan Klinis per Instrumen

### A.1 PSS-10 (Perceived Stress Scale — 10 Item)

**A.1.1 Ambang Batas Skor Bukan Cutoff Klinis Resmi**

Rentang interpretasi yang digunakan — Rendah (0–13), Sedang (14–26), Tinggi (27–40) — adalah panduan heuristik yang banyak diadopsi dalam literatur sekunder, bukan cutoff klinis resmi yang dipublikasikan oleh Cohen et al. (1983) dalam makalah aslinya. Cohen sendiri tidak pernah menetapkan ambang batas kategorikal; angka-angka ini muncul dari pembagian tertil distribusi sampel komunitas Amerika. Implikasinya: interpretasi kategori harus selalu disertai kalimat "hasil ini merupakan *indikasi*, bukan diagnosis."

**Rekomendasi:** Kembangkan tabel persentil berbasis data platform (setelah cukup data terkumpul dari pengguna Indonesia) untuk menggantikan atau melengkapi ambang batas heuristik ini.

**A.1.2 Struktur Dua Faktor Belum Diuji Secara Lokal**

Struktur dua faktor PSS-10 — Ketidakberdayaan (*Perceived Helplessness*) dan Efikasi Diri (*Perceived Self-Efficacy*) — telah dikonfirmasi melalui CFA pada sampel Indonesia oleh Pratiwi et al. (2024) dan Hapsari et al. (2025). Namun kedua studi tersebut menggunakan sampel mahasiswa dan karyawan di Jawa; belum ada validasi spesifik untuk populasi mahasiswa UKRIDA Jakarta. Norma populasi yang digunakan (Cohen & Janicki-Deverts, 2012) berasal dari sampel Amerika Serikat.

**Rekomendasi:** Lakukan studi normatif lokal menggunakan data yang terkumpul dari platform ini, dengan persetujuan IRB dan prosedur informed consent yang telah tersedia dalam sistem.

**A.1.3 Keterbatasan Jendela Waktu**

PSS-10 mengukur stres yang *dirasakan* dalam 30 hari terakhir. Validitas prediktifnya menurun setelah 4–8 minggu karena instrumen ini mengukur kondisi kognitif terkini, bukan sifat psikologis yang stabil. Platform saat ini belum memiliki fitur notifikasi atau pengingat untuk mendorong pengguna mengulang asesmen secara berkala.

**A.1.4 Pelaporan Subskala Dimensi Tidak Aktif di Database (✅ TELAH DISELESAIKAN — 6 Juli 2026)**

Meski literatur mendukung struktur dua-faktor (Ketidakberdayaan dan Efikasi Diri), sebelumnya di dalam database, ke-10 pertanyaan PSS-10 memiliki atribut `dimension = NULL`. 
**Status Perbaikan (FH-1 / FH-2):** Seluruh 10 item PSS-10 di produksi telah diperbarui dengan dimensi non-NULL (`Helplessness` ×6, `Self-Efficacy` ×4). Kalkulasi dan pelaporan subskala di _scoring engine_ kini berfungsi penuh sesuai spesifikasi klinis.

---

### A.2 GPIUS-2 (Generalized Problematic Internet Use Scale 2 — Adaptasi Indonesia)

**A.2.1 Instrumen yang Digunakan adalah Adaptasi Lokal, Bukan Versi Caplan Asli**

Platform ini mengimplementasikan GPIUS-2 versi Bahasa Indonesia yang dikembangkan oleh Reynaldo, R., dan Sokang, Y. A. (2016) dari Fakultas Psikologi UKRIDA — sebuah kontribusi akademik internal universitas ini sendiri. Skala Likert yang digunakan adalah 1–5 poin, sementara skala asli Caplan (2010) menggunakan 1–8 poin. Perbedaan ini adalah pilihan metodologis yang terdokumentasi dan valid, namun berarti skor tidak dapat langsung dibandingkan dengan penelitian internasional yang menggunakan versi 1–8.

**Rekomendasi:** Setiap publikasi atau laporan yang menggunakan data dari platform ini harus menyebutkan versi adaptasi Reynaldo & Sokang (2016), bukan hanya Caplan (2010).

**A.2.2 Rentang Interpretasi Merupakan Panduan Heuristik, Bukan Cutoff yang Dipublikasikan**

Tidak ada cutoff klinis yang dipublikasikan untuk GPIUS-2 dalam versi mana pun, termasuk Caplan (2010) dan Reynaldo & Sokang (2016). Platform ini menggunakan skema interpretasi berbasis rata-rata (*mean-anchored*) yang mengacu pada nilai rata-rata sampel Jakarta dari Reynaldo & Sokang (2016): rata-rata total X̄ = 43,41 (N = 474, tiga universitas Jakarta). Rentang saat ini:

- Skor ≤43: Di Bawah Rata-Rata Referensi
- Skor 44–58: Sekitar Rata-Rata Referensi
- Skor ≥59: Di Atas Rata-Rata Referensi

Keterbatasan penting: standar deviasi tidak dilaporkan dalam makalah Reynaldo & Sokang (2016), sehingga rentang "sekitar rata-rata" (44–58) ditetapkan secara pragmatis, bukan berdasarkan ±1 SD yang secara statistik standar.

**Rekomendasi:** Dengan akumulasi data dari platform, hitung norma lokal berbasis persentil (P25, P50, P75) untuk menggantikan panduan heuristik ini.

**A.2.3 Tidak Ada Data Normatif untuk Subskala**

Lima subskala GPIUS-2 — POSI (*Preference for Online Social Interaction*), MR (*Mood Regulation*), CP (*Cognitive Preoccupation*), CU (*Compulsive Use*), NO (*Negative Outcomes*) — juga menggunakan rata-rata referensi dari Reynaldo & Sokang (2016) Tabel 3. Namun, tidak ada standar deviasi yang dilaporkan untuk setiap subskala, sehingga batas "di atas rata-rata" ditetapkan secara pragmatis pula. Subskala DSR (*Deficient Self-Regulation* = CP + CU) merupakan konstruk orde kedua yang hanya digunakan sebagai indikator derivatif, bukan subskala yang berdiri sendiri dalam makalah asli.

**A.2.4 Implementasi Sistem: Skor Dimensi Tidak Berfungsi / Subskala Hilang (✅ TELAH DISELESAIKAN — 6 Juli 2026)**

Meskipun pada spesifikasi tes diatur menggunakan _scoring method_ `dimensional`, sebelumnya ke-15 item GPIUS-2 di database diisi dengan `dimension = NULL`.
**Status Perbaikan (FH-1 / FH-2):** Seluruh 15 item GPIUS-2 di produksi telah diperbarui dengan dimensi non-NULL (`POSI` ×3, `MR` ×3, `CP` ×3, `CU` ×3, `NO` ×3). _Scoring engine_ kini melaporkan ke-5 subskala secara spesifik dan akurat.

**A.2.5 Validitas Konvergen dan Divergen Belum Diuji pada Platform Ini**

Belum ada studi yang menguji apakah skor GPIUS-2 dari platform ini berkorelasi dengan variabel kriteria eksternal (misalnya durasi penggunaan internet terukur, nilai akademik, atau skala kesejahteraan psikologis lainnya).

---

### A.3 SRS (Simplified Resilience Score — Adaptasi Dekan)

**A.3.1 Instrumen Ini adalah Adaptasi Internal, Belum Divalidasi Secara Peer-Review**

SRS yang diimplementasikan adalah adaptasi institusional yang dikembangkan oleh Dekan Fakultas Psikologi UKRIDA, mengambil item dari tiga sumber yang telah divalidasi secara internasional:
- *Satisfaction With Life Scale* — Diener, Emmons, Larsen & Griffin (1985) [item kepuasan: Q2, Q4, Q9]
- *Pearlin Mastery Scale* — Pearlin & Schooler (1978) [item efikasi dan kontrol: Q1, Q3, Q5, Q6, Q7, Q8, Q10, Q11]
- *Simplified Resilience Score* — Manning, Carr & Kail (2016) [kerangka komposit]

Tidak ada studi psikometri yang dipublikasikan secara peer-review untuk versi 11-item, skala Likert 1–6, dengan tiga subskala (Efikasi/Kepuasan/Kontrol) yang spesifik ini.

**A.3.2 Dua Pertanyaan Terbuka kepada Dekan Belum Terjawab**

Hingga serah terima ini, terdapat dua pertanyaan yang belum mendapat konfirmasi dari Dekan dan perlu dijawab untuk dokumentasi ilmiah yang lengkap:

1. **Item yang Dihilangkan:** Manning et al. (2016) mempublikasikan 12 item dalam SRS asli. Adaptasi Dekan menggunakan 11 item. Item mana yang dihilangkan dan apa alasannya?
2. **Atribusi Struktur Tiga Subskala:** Apakah pembagian tiga subskala (Efikasi/Kepuasan/Kontrol) diperkenalkan oleh Dekan, atau mengacu pada sumber publikasi tertentu? Manning et al. (2016) memperlakukan SRS sebagai konstruk unidimensional dalam makalah aslinya.

**Rekomendasi:** Dokumentasikan jawaban atas kedua pertanyaan ini dalam laporan metodologis sebelum data dari platform digunakan dalam publikasi ilmiah.

**A.3.3 Tidak Ada Data Normatif yang Tersedia**

Tidak ada studi normatif yang dipublikasikan untuk versi adaptasi ini pada populasi Indonesia. Rentang interpretasi yang digunakan — Rendah (11–33), Sedang (34–50), Tinggi (51–66) — adalah tertil pragmatis dari rentang teoritis skala (11–66), bukan ambang batas yang berasal dari sampel empiris.

**Penting:** Berbeda dengan GPIUS-2 yang memiliki rata-rata referensi dari sampel Jakarta (Reynaldo & Sokang, 2016), SRS tidak memiliki nilai rata-rata populasi Indonesia sebagai pembanding. Dengan demikian, setiap pernyataan interpretasi tidak dapat mengacu pada "di atas rata-rata" atau "di bawah rata-rata" secara valid. Platform ini menggunakan catatan pengungkapan (*disclosure note*) pada setiap deskripsi band sedang: *"Belum tersedia data normatif untuk populasi Indonesia untuk versi adaptasi skala ini."*

**A.3.4 Pelaporan Subskala Dimensi Tidak Aktif di Database (✅ TELAH DISELESAIKAN — 6 Juli 2026)**

Adaptasi Dekan mendefinisikan tiga subskala (Efikasi, Kepuasan, Kontrol), namun sebelumnya di dalam database ke-11 pertanyaan SRS di set dengan nilai `dimension = NULL`.
**Status Perbaikan (FH-1 / FH-2):** Seluruh 11 item SRS di produksi telah dipetakan dengan benar ke dimensi `Efficacy` ×3, `Satisfaction` ×3, dan `Control` ×5. Subskala kini dihitung dan disajikan kepada pengguna.

**A.3.5 Validasi Instrumen Direkomendasikan**

Mengingat bahwa platform ini akan mengumpulkan data dari banyak pengguna, terdapat peluang riset yang sangat besar: dengan desain penelitian yang tepat (persetujuan IRB, prosedur informed consent), data platform ini dapat digunakan untuk:
- Melakukan CFA untuk mengkonfirmasi struktur tiga faktor
- Menghitung norma lokal UKRIDA/Jakarta
- Menguji validitas konvergen dengan instrumen resiliensi yang sudah tervalidasi (misalnya BRS oleh Smith et al., 2008)

---

### A.4 SRQ-29 (Self-Reporting Questionnaire — Adaptasi Kemenkes RI)

**A.4.1 Ambang Batas Domain Neurosis Mengikuti Konvensi Kemenkes, Bukan WHO Global**

Platform menggunakan ambang batas ≥6 untuk domain Neurosis/GME (*Gangguan Mental Emosional*), sesuai standar Kemenkes RI yang digunakan dalam RISKESDAS 2013 dan 2018, serta studi validasi Idaiani et al. (2009) yang melaporkan sensitivitas 73,75% dan spesifisitas 94,12% pada ambang batas ini. Namun, WHO User's Guide (Beusenberg & Orley, 1994) menyebutkan bahwa ambang batas optimal perlu divalidasi secara empiris di setiap konteks budaya. Beberapa studi lain di negara berbeda menggunakan ambang batas ≥5 atau ≥8.

**A.4.2 Ambang Batas Domain PTSD**

Domain PTSD (item Q25–Q29) menggunakan ambang batas ≥1 (satu atau lebih jawaban "Ya" dianggap sebagai indikasi gejala PTSD), sesuai protokol Kemenkes. Beberapa sumber klinis merekomendasikan ambang batas ≥3 untuk spesifisitas yang lebih tinggi. Pilihan ≥1 bersifat lebih sensitif (lebih banyak kasus terdeteksi) tetapi juga lebih banyak menghasilkan *false positive*.

**Rekomendasi untuk pengembang berikutnya:** Pertimbangkan untuk menambahkan konfigurasi ambang batas per domain yang dapat diatur oleh administrator klinis, sehingga fleksibel sesuai konteks penggunaan.

**A.4.3 Item 21 (Domain Zat Adiktif) Memiliki Loading Faktor Lemah**

Faridah et al. (2024) dalam studi psikometri SRQ-29 pada mahasiswa Indonesia menemukan bahwa item Q21 (domain zat/alkohol) memiliki *factor loading* yang lemah pada sampel mahasiswa, hingga model SRQ-28 (tanpa item 21) menunjukkan reliabilitas yang lebih baik (α = 0,895). Platform ini tetap menggunakan 29 item sesuai protokol Kemenkes, namun interpretasi domain zat harus digunakan dengan lebih hati-hati, terutama pada sampel mahasiswa.

**A.4.4 Inkonsistensi Parameter Dimensi pada Seed Data (✅ TELAH DISELESAIKAN — 6 Juli 2026)**

Dari 29 item SRQ-29 di database, sebelumnya terdapat 10 item yang tidak memiliki nilai dimensi (`dimension = NULL`).
**Status Perbaikan (FH-1 / FH-2):** Seluruh 29 item SRQ-29 di produksi kini memiliki dimensi non-NULL (`neurotic` ×20, `psychotic` ×3, `ptsd` ×5, `substance` ×1). Akurasi deteksi spesifik per domain kini 100% konsisten dengan protokol Kemenkes.

---

## Bagian B — Celah Fungsionalitas & Keselarasan Data (Fitur)

Bagian ini mendokumentasikan fungsionalitas yang masih terputus (disconnected) atau memiliki cacat logika integrasi, meskipun modul panel admin maupun antarmuka utama sebagian besar telah selesai dibangun.

### B.1 Celah Integrasi Data Asesmen (Sangat Kritis)

Saat ini platform memiliki masalah **"Dua Sumber Kebenaran" (Dual Source of Truth)** pada pertanyaan instrumen:
- **Di sisi Admin:** Admin membuat, mengedit, dan menyimpan soal beserta pilihan jawaban (`options`) ke dalam database (tabel `questions` dan `options`).
- **Di sisi Pengguna/Publik:** Formulir asesmen (`src/app/test/[slug]/page.tsx`) membaca daftar pertanyaan secara statis dari fail `src/lib/data/questions.ts`, bukan dari database. Prosedur API `getTestBySlug` juga tidak menggabungkan (`join`) tabel _questions_ dan _options_.

**Implikasi:** Modul Manajemen Pertanyaan dan Manajemen Tes yang telah 100% selesai di Panel Admin pada dasarnya **tidak berdampak apa-apa** bagi pengguna. Semua perubahan tes, perbaikan soal, dan skala yang diedit admin *tidak akan terlihat* di tes yang diambil oleh klien, kecuali programmer meng-update fail lokal tersebut. Ini menggagalkan fungsi utama Panel Admin.

### B.2 Fitur Akun Pengguna & Transisi

Sebagian besar fitur manajemen akun sudah selesai (Profil, Halaman Profil, Manajemen Akun di Admin), namun ada beberapa alur tersisa:

| Fitur | Status | Keterangan |
|---|---|---|
| Halaman profil pengguna | ✅ Selesai | Dapat mengedit profil dan data demografis |
| Migrasi hasil tamu → akun | ✅ Terintegrasi | Tombol _AutoClaim_/_ClaimCTA_ sudah tersambung dengan JWT / Profil pengguna |
| Verifikasi email & reset password (publik) | ❌ Belum ada | Mekanisme lupa kata sandi untuk pengguna umum belum ada, baru tersedia untuk Admin |
| Login dengan Google (SSO) | ❌ Belum ada | Skema database sudah siap, `GOOGLE_CLIENT_ID` ada di env, namun belum dikonfigurasi |
| Notifikasi pengingat asesmen | ❌ Belum ada | Tidak ada sistem pengingat berkala |

### B.3 Panel Admin — Modul yang Kurang Fungsional

Sebagian besar Panel Admin telah diselesaikan (CRUD Tes, Skala, Pertanyaan, Manajemen Akun, Log Audit, Dasbor, Profil Admin), namun ada kelemahan mendasar:

| Modul Admin | Status Kekurangan | Keterangan Risiko |
|---|---|---|
| **Manajemen Pertanyaan** | Hardcoded skala 1-5 | Pembuatan soal baru oleh admin terkunci ke tipe `likert_5` secara *hardcoded* pada antarmuka, membuat admin tidak dapat membuat tes semacam SRQ-29 (opsi Yes/No / binary) atau SRS (6 opsi) secara mandiri. Reorder pertanyaan juga belum memiliki fungsi _drag-and-drop_. |
| **Penerbitan Tes (Publish)**| Validasi lemah | Mempublikasikan tes hanya mensyaratkan 1 soal, tanpa memeriksa kelengkapan Opsi Jawaban atau aturan Skor (Interpretasi). Admin berisiko menerbitkan tes rongsok yang menyebabkan crash sistem klien. |

### B.4 Modul Laporan PDF & Antarmuka Dasbor Hasil

Backend untuk pembuatan laporan PDF (menggunakan `@react-pdf/renderer`) telah diimplementasikan dan berfungsi. Namun alur pengiriman laporan melalui email belum sepenuhnya tersambung ke antarmuka pengguna.

| Sub-fitur | Status |
|---|---|
| Pembuatan PDF di server | ✅ Selesai |
| Pengiriman email melalui Resend | ✅ Selesai (backend) |
| Permintaan laporan oleh pengguna dari UI | ✅ Selesai |
| Persetujuan laporan oleh admin | ✅ Selesai |
| Pengiriman otomatis setelah persetujuan | ⚠️ Memerlukan verifikasi end-to-end |
| **Bug UI Komponen Hasil** | `maxScore={100}` dan `questionCount: 0` ter-hardcode secara sepihak. Radial gauge (persentase) memberikan info keliru karena asumsikan semua instrumen skor maksimal adalah 100. Tulisan "Items: 0" selalu muncul meski pertanyaan banyak. |

### B.5 Fitur Tambahan yang Direncanakan namun Belum Dimulai

- **Tabel persentil berbasis platform** — Seiring akumulasi data pengguna, sistem dapat menghasilkan norma lokal secara otomatis.
- **Multi-bahasa** — Platform saat ini hanya dalam Bahasa Indonesia.
- **Mode kiosk** — Mode pengambilan asesmen tanpa koneksi internet untuk penggunaan di lapangan.

---

## Bagian C — Keterbatasan Teknis

### C.1 Hasil Historis Sebelum Perbaikan Denominasi DSR

Sebelum komit `e60742c` (19 Mei 2026), semua hasil asesmen GPIUS-2 yang telah tersimpan menampilkan DSR (*Deficient Self-Regulation*) dengan denominator yang salah — 18/18 (100%) alih-alih 18/30 (60%). Ini terjadi karena komponen visualisasi menggunakan nilai maksimum yang disimpulkan secara salah. Perbaikan telah diterapkan untuk semua pengiriman baru. Hasil yang sudah ada sebelum tanggal tersebut tidak di-backfill dan masih menampilkan denominasi yang salah jika dibuka kembali.

**Rekomendasi:** Buat skrip backfill untuk memperbarui payload `computedScores` pada hasil historis, serupa dengan skrip `remediate-scores.ts` yang digunakan dalam siklus remediasi.

### C.2 Suite Pengujian Terbatas pada Unit Test

Platform memiliki 157 unit test yang semuanya lulus, namun:
- **Pengujian E2E (End-to-End) (✅ TELAH DISELESAIKAN — 6 Juli 2026)**: Suite pengujian Playwright komprehensif (12/12 tes lulus) telah dibangun dan dikonfigurasi menggunakan database uji terisolasi (`.env.test.local`). Mencakup autentikasi admin, alur asesmen publik, persetujuan privasi UU PDP, dan manajemen instrumen.
- **Pengujian lintas browser** — hanya diverifikasi di Chrome/Chromium.
- **Tidak ada mekanisme Error Boundary** — Tidak satupun direktori rute di `src/app/` menggunakan fitur fail Next.js seperti `error.tsx`, `loading.tsx`, atau `not-found.tsx`. Bila terjadi galat data, halaman akan rusak secara fatal dan memperlihatkan log error mentah atau *white screen of death*.

### C.3 Persoalan Teknis Integritas Transaksi dan Logika Database

- **Atomicity Pengiriman Hasil**: Penyimpanan tes (`submitAssessment`) mencatat perubahan status di tabel `test_sessions` sebelum mencatatkan hasil kalkulasi ke `results`. Karena arsitektur `drizzle-orm/neon-http` tidak mendukung konsep Transaction secara natif, hal ini meninggalkan risiko *orphan-session* bila koneksi terputus di tengah proses, meskipun hingga kini 27 sesi tes masuk tanpa cacat.
- **Tabel `scoring_rules` Tidak Terpakai**: Modul kalkulasi logika lebih terintegrasi pada TypeScript code murni dan kolom _result_interpretations_, menyebabkan tabel `scoring_rules` ditinggalkan kosong (unused). Begitu juga dengan `guest_leads`, `accounts`, `verification_tokens`.

### C.4 Penyimpanan Data Sensitif dan Kepatuhan UU PDP

Platform telah mengimplementasikan modul persetujuan (*consent module*) yang selaras dengan UU PDP. Namun beberapa hal masih perlu diperhatikan:

- **Enkripsi Pseudo (✅ TELAH DISELESAIKAN — S-9/S-17)**: Skema pelindungan data User-Agent dan Alamat IP bagi tamu anonim kini menggunakan algoritma kriptografi searah HMAC-SHA256 dengan pengecekan *fail-loud* terhadap `ENCRYPTION_KEY`, menggantikan metode penyandian dasar `btoa()`.
- **Implisit Consent**: Pemanggilan titik API `startSession` secara mutlak akan meresmikan nilai persetujuan ke tabel tanpa validasi dari opsi formulir muka. 
- **Kebijakan retensi data** — Belum ada mekanisme otomatis untuk menghapus data pengguna sesuai permintaan (*right to erasure*) yang diamanatkan UU PDP.
- **Kebijakan privasi yang dipublikasikan** — Platform belum memiliki halaman kebijakan privasi yang dapat diakses publik.

### C.5 Ketergantungan pada Layanan Pihak Ketiga

Platform bergantung pada beberapa layanan eksternal yang memiliki implikasi keberlangsungan:

| Layanan | Fungsi | Risiko |
|---|---|---|
| Neon PostgreSQL | Database utama | Jika langganan tidak diperpanjang, data tidak dapat diakses |
| Upstash Redis | Rate limiting API | Jika tidak aktif, perlindungan API berkurang |
| Resend | Pengiriman email | Jika tidak aktif, fitur laporan email berhenti |
| Sentry | Pemantauan error | Jika tidak aktif, error produksi tidak terpantau |
| Vercel | Hosting | Jika tidak aktif, platform tidak dapat diakses |

**Rekomendasi:** Pastikan semua akun layanan ini dipindahkan ke email institusional UKRIDA sebelum atau segera setelah serah terima, untuk menghindari kehilangan akses jika akun personal mahasiswa tidak aktif.

---

## Bagian D — Rekomendasi Prioritas untuk Pengembangan Lanjutan

Berdasarkan seluruh keterbatasan di atas, berikut adalah rekomendasi yang diprioritaskan berdasarkan dampak fungsional, klinis dan kelayakan teknis:

### Prioritas Tinggi (Sangat Kritis)

1. **Perbaiki Arsitektur Dual Source of Truth** — Ini adalah kelemahan arsitektur paling fatal. Implementasikan rute `src/app/test/[slug]/page.tsx` untuk membaca objek _questions_ secara dinamis dari API `getTestBySlug` yang tergabung (*relational query*) dengan _options_, sehingga admin bisa bebas membuat atau mengedit soal.
2. **Koreksi Dimensi Instrumen (Klinis) (✅ SELESAI — FH-1/FH-2)** — Seluruh 65 item pada 4 instrumen (PSS-10, GPIUS-2, SRS, SRQ-29) telah dipetakan ke dimensi non-NULL di database produksi.
3. **Pengamanan Enkripsi Anonimitas (✅ SELESAI — S-9/S-17)** — Fungsi dekode `btoa()` untuk hash _user-agent_ dan IP telah diganti dengan HMAC-SHA256 berstandar kriptografis di backend.
4. **Implementasi UI Pelindung Galat (*Error Boundary*)** — Masukkan utilitas `error.tsx`, `loading.tsx`, dan `not-found.tsx` ke dalam struktur folder aplikasi App Router Next.js untuk mencegah layar sistem memutih/putus (fatal crash) dari galat.

### Prioritas Menengah (Penyempurnaan Fungsionalitas)

5. **Lengkapi Editor Pertanyaan Admin** — Integrasikan opsi varian seperti tipe *binary* / *Likert-6* / *Likert-7* saat pembuatan pertanyaan baru di Admin, dan pasang fitur UI _drag-and-drop_ supaya pengurutan soal intuitif.
6. **Perbaiki Variabel Skor Laporan (*Radial Gauge*)** — Hapuskan pengkodean tetap `maxScore={100}` atau `questionCount: 0` pada UI Halaman Skor di folder `/results/` dan `/admin/results/` supaya persentase nilai sesuai batas spesifikasi setiap instrumen yang berbeda.
7. **Pengujian E2E Playwright (✅ SELESAI — 6 Juli 2026)** — Suite pengujian E2E komprehensif telah dikonfigurasi dan diverifikasi lulus 12/12 tes terhadap database uji terisolasi.

### Prioritas Rendah (Jangka Panjang & Ekspansi)

8. **Studi validasi normatif lokal** — Menggunakan data operasional aplikasi saat ini untuk menghitung model statistik yang representatif dan menetapkan batas uji psikologis lokal.
9. **Kepatuhan Retensi PDP Penuh** — Fasilitasi hak *right to erasure* dan publikasi dokumen panduan Kebijakan Privasi di beranda awal.
10. **Migrasi Neon DB ke Driver Transaksional** — Refaktor infrastruktur Drizzle ORM ke konektor seperti _Neon Serverless (WebSocket)_ yang secara natif mengakui protokol Transaksional (BEGIN-COMMIT) agar interupsi penulisan bisa di-_rollback_ otomatis tanpa meninggalkan sisa (_orphan data_).

---

## Daftar Referensi

- Beusenberg, M., & Orley, J. (1994). *A User's Guide to the Self-Reporting Questionnaire (SRQ)*. World Health Organization.
- Caplan, S. E. (2010). Theory and measurement of generalized problematic Internet use: A two-step approach. *Computers in Human Behavior, 26*(5), 1089–1097.
- Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. *Journal of Health and Social Behavior, 24*(4), 385–396.
- Cohen, S., & Janicki-Deverts, D. (2012). Who's stressed? Distributions of psychological stress in the United States. *Journal of Applied Social Psychology, 42*(6), 1320–1334.
- Diener, E., Emmons, R. A., Larsen, R. J., & Griffin, S. (1985). The Satisfaction With Life Scale. *Journal of Personality Assessment, 49*(1), 71–75.
- Faridah, L., et al. (2024). Psychometric analysis of the SRQ-29 among university students. *Jurnal Ilmiah Psikologi Terapan (JIPT)*, Universitas Muhammadiyah Surakarta.
- Hapsari, F. M., et al. (2025). Indonesian version of the Perceived Stress Scale-10 (IPSS) in adolescents with obesity. *medRxiv preprint*.
- Harding, T. W., et al. (1980). Mental disorders in primary health care. *Psychological Medicine, 10*(2), 231–241.
- Idaiani, S., et al. (2009). Analisis gejala gangguan jiwa dan faktor yang mempengaruhi. *Majalah Kedokteran Indonesia, 59*(10), 473–479.
- Idaiani, S., et al. (2022). The validity of the self-reporting questionnaire-20 for symptoms of depression. *Open Access Macedonian Journal of Medical Sciences, 10*(E).
- Kementerian Kesehatan Republik Indonesia. (2018). *Laporan Nasional RISKESDAS 2018*. Jakarta: Badan Litbangkes.
- Manning, L. K., Carr, D. C., & Kail, B. L. (2016). Do higher levels of resilience buffer the deleterious impact of chronic illness on disability in later life? *The Gerontologist, 56*(3), 514–524.
- Pearlin, L. I., & Schooler, C. (1978). The structure of coping. *Journal of Health and Social Behavior, 19*(1), 2–21.
- Pratiwi, A., Sutrisno, J., & Wibowo, A. P. (2024). Psychometric properties of the Perceived Stress Scale (PSS-10) in Indonesian version. *JP3I, 13*(2), 117–129.
- Prasetya, M. A., et al. (2020). Validasi PSS-10 versi Indonesia menggunakan model Rasch.
- Reynaldo, R., & Sokang, Y. A. (2016). Mahasiswa dan internet: Dua sisi mata uang? *Jurnal Psikologi (UGM), 43*(2), 107–120.
- Roberti, J. W., Harrington, L. N., & Storch, E. A. (2006). Further psychometric support for the 10-item version of the PSS. *Journal of College Counseling, 9*(2), 135–147.
- Smith, B. W., et al. (2008). The Brief Resilience Scale. *International Journal of Behavioral Medicine, 15*(3), 194–200.

---

*Dokumen ini disusun dengan transparansi penuh sebagai bagian dari pertanggungjawaban ilmiah proyek Kerja Praktik. Keterbatasan yang didokumentasikan di sini bukan merupakan kekurangan fatal, melainkan peta jalan yang jelas untuk pengembangan lanjutan.*
