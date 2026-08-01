# Kebijakan Privasi Ekstensi Browser "Weather Please"

_Terakhir diperbarui: 1 Agustus 2026_

Kebijakan ini menjelaskan data yang diakses ekstensi "Weather Please", cara data
digunakan dan dilindungi, serta pilihan yang tersedia bagi Anda.

## 1. Informasi yang tidak kami kumpulkan

Ekstensi tidak mengakses atau mengumpulkan riwayat penjelajahan, isi situs yang
Anda kunjungi, kontak, file, atau pengenal iklan. Kami tidak mengoperasikan
server yang menerima atau menyimpan data Akun Google atau Google Kalender Anda.

## 2. Geolokasi dan layanan pihak ketiga

Untuk cuaca setempat, "Weather Please" menggunakan lokasi perangkat (lintang dan
bujur). Jika akses ditolak, ekstensi tidak akan berfungsi. Lokasi dikirim
langsung ke layanan pihak ketiga untuk memperoleh cuaca dan nama tempat yang
mudah dibaca; kebijakan mereka berlaku:

- [Open-Meteo](https://open-meteo.com/en/terms)
- [Nominatim/OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)

Nominatim mengubah koordinat menjadi nama tempat (geocoding terbalik). Lokasi
hanya dikirim untuk permintaan tersebut.

## 3. Data pengguna Google dan integrasi Kalender (opsional)

Anda dapat menghubungkan Akun Google untuk menampilkan acara mendatang di tab
baru. Ekstensi memakai Google OAuth 2.0 dan meminta cakupan
`calendar.events.readonly`. Fitur cuaca tidak memerlukan akses kalender.

<a id="google-user-data-access"></a>

### 3.1 Data pengguna Google yang kami akses

Jika Anda menghubungkan akun, kami mengakses:

- pengenal akun stabil serta alamat email atau nama, hanya untuk mengenali dan
  memberi label akun yang terhubung;
- token akses dan refresh OAuth untuk mengautentikasi permintaan dan menjaga
  koneksi;
- hingga 10 acara kalender utama dalam tiga hari mendatang: judul, deskripsi,
  waktu mulai/selesai, status sepanjang hari, lokasi, status dan pengenal acara,
  serta tautan sumber Google Kalender.

Akses bersifat hanya-baca. Ekstensi tidak dapat membuat, mengubah, atau
menghapus acara maupun kalender.

<a id="google-user-data-use"></a>

### 3.2 Cara kami menggunakan data pengguna Google

Data akun dan token hanya digunakan untuk menghubungkan akun, memperbarui
koneksi, dan melakukan permintaan baca yang diizinkan. Acara hanya ditampilkan,
dikelompokkan, diurutkan, dihapus duplikatnya, serta diberi tautan ke sumber.

Data Google tidak digunakan untuk iklan, pembuatan profil, keputusan kredit atau
kelayakan, maupun mengembangkan, meningkatkan, atau melatih model AI/ML umum.

<a id="google-user-data-sharing"></a>

### 3.3 Pembagian, transfer, dan pengungkapan

Data berjalan langsung antara Google dan ekstensi di browser dan tidak dikirim
ke server kami. Kami tidak menjual, menyewakan, membagikan, mentransfer, atau
mengungkapkannya kepada pihak ketiga, pengiklan, broker data, atau pengguna
lain. Kami tidak mengizinkan manusia membaca data Google Anda.

<a id="google-user-data-protection"></a>

### 3.4 Penyimpanan dan perlindungan

Autentikasi memakai alur OAuth 2.0 Authorization Code dengan PKCE; ekstensi
tidak pernah menerima atau menyimpan kata sandi Google. Permintaan memakai
HTTPS/TLS dan hanya akses baca yang diperlukan yang diminta.

Detail acara hanya berada di memori browser. Token, pengenal, dan label akun
disimpan secara lokal di penyimpanan browser, terisolasi pada origin ekstensi
dan dilindungi profil browser serta kontrol sistem operasi. Data Google tidak
dimasukkan ke analitik, diagnostik, atau log aplikasi.

<a id="google-user-data-retention"></a>

### 3.5 Retensi dan penghapusan

Detail acara dibuang saat halaman ditutup/dimuat ulang, diganti data baru, atau
akun diputus. Token dan informasi akun hanya disimpan lokal selama akun
terhubung. Memutus akun akan menghapusnya; menghapus ekstensi juga menghapus
penyimpanan lokal ekstensi.

Anda juga dapat mencabut akses di
[Koneksi Akun Google](https://myaccount.google.com/connections), yang
membatalkan otorisasi. Kami tidak menyimpan salinan di server atau cadangan
server.

### 3.6 Kebijakan Data Pengguna Layanan API Google

Penggunaan dan transfer informasi dari Google API mematuhi
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
termasuk persyaratan Penggunaan Terbatas.

## 4. Data Microsoft Outlook (opsional)

Anda juga dapat menghubungkan Outlook. Autentikasi dilakukan langsung dengan
Microsoft melalui OAuth 2.0; kami tidak melihat atau menyimpan kata sandi. Akses
hanya-baca, acara ditampilkan lokal, dan token lokal dihapus saat diputus. Akses
juga dapat dicabut di Microsoft. Berlaku
[Pernyataan Privasi Microsoft](https://privacy.microsoft.com/privacystatement).

## 5. Penggunaan informasi lain

Lokasi hanya digunakan untuk cuaca setempat dan nama tempat. Data cuaca,
pengaturan, serta cache lokasi dapat disimpan lokal agar pemuatan cepat dan
preferensi diingat.

## 6. Pilihan Anda

Anda dapat menolak lokasi, tetapi ekstensi tidak akan berfungsi. Koneksi
kalender sepenuhnya opsional dan dapat diputus kapan saja.

## 7. Perubahan kebijakan

Kami dapat memperbarui kebijakan ini. Perubahan berlaku ketika dipublikasikan di
halaman ini.

## 8. Kontak

Hubungi [contact@weather-please.app](mailto:contact@weather-please.app).
