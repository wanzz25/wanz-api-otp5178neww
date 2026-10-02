DEPLOY WANZ API - VERCEL ATAU VPS

================================================================================
DEPLOY KE VERCEL (GRATIS)
================================================================================

CARA 1 - VIA GITHUB:

1. Push project ke GitHub

2. Login ke vercel.com pakai akun GitHub

3. Klik Add New > Project

4. Pilih repository, klik Import

5. Biarkan semua pengaturan default:
   - Framework Preset: Other
   - Root Directory: ./
   - Build settings: kosong

6. Klik Deploy

Selesai. Dapat domain gratis seperti: wanz-api.vercel.app
Setiap git push otomatis deploy ulang.

CARA 2 - VIA TERMINAL:

npm install -g vercel
vercel login
vercel
vercel --prod

================================================================================
DEPLOY KE VPS (UBUNTU/DEBIAN)
================================================================================

STEP 1 - PERSIAPAN SERVER:

sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git software-properties-common
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

STEP 2 - CLONE PROJECT:

cd /var/www
git clone <URL_REPO_ANDA> wanz-api
cd wanz-api
npm install

STEP 3 - PM2 (AGAR APLIKASI TETAP JALAN):

sudo npm install pm2 -g
pm2 start index.js --name "wanz-api"
pm2 startup
pm2 save

STEP 4 - NGINX REVERSE PROXY:

sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/wanz-api

Copy-paste ini (ganti domain_anda.com):

server {
    listen 80;
    server_name domain_anda.com www.domain_anda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

sudo ln -s /etc/nginx/sites-available/wanz-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

STEP 5 - SSL GRATIS:

sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain_anda.com -d www.domain_anda.com

Ikuti instruksi, pilih redirect HTTP ke HTTPS.

================================================================================
CATATAN PENTING
================================================================================

- Jangan hardcode API key di file HTML atau client-side
- Selalu gunakan route /ai/gemini sebagai proxy server-side
- Untuk local testing: node index.js lalu buka http://localhost:3000

================================================================================

================================================================================
LOGIN GOOGLE + APIKEY PUBLIK
================================================================================

1. Google Cloud Console > APIs & Services > Credentials > Create OAuth client ID
   (Web application). Di "Authorized JavaScript origins" isi domain kamu,
   mis. https://wanz-api.vercel.app dan https://lizypaaannel.smasnug.web.id
2. Isi environment variable (lihat .env.example): GOOGLE_CLIENT_ID,
   SESSION_SECRET, DEV_API_KEY, dan di Vercel wajib UPSTASH_REDIS_REST_URL +
   UPSTASH_REDIS_REST_TOKEN.
3. User buka /profile (/dashboard otomatis diarahkan ke sana), login Google, apikey format Api-xxxxxxxx-wanz dibuat
   otomatis. Limit free 500 request per hari (reset 00.00 WIB).
4. Apikey dev (DEV_API_KEY) tanpa limit.
5. Apikey bisa dikirim lewat ?apikey= atau header x-api-key.

6. Login ganda: tombol Google (nama otomatis dari akun Gmail) atau daftar/masuk
   manual pakai nama + email + password.
7. Akun dev: isi DEV_EMAILS dengan Gmail kamu, lalu login pakai Google. Apikey
   akun itu otomatis tanpa limit. Akun manual tidak bisa jadi dev.
8. Login dev manual: username wanz (kolom email) + DEV_PASSWORD dari environment.
   Akun ini tampil sebagai "Wanz", tanpa limit, apikey-nya = DEV_API_KEY.
   Nama "wanz" tidak bisa dipakai saat daftar biasa.
9. Halaman /profile: apikey, limit, dan grafik pemakaian per hari (7/14/30 hari).
   Tombol Profil muncul di header semua halaman lewat views/profile-link.js.
   Riwayat pemakaian disimpan 35 hari.

================================================================================
OTP EMAIL (VERIFIKASI SAAT DAFTAR MANUAL)
================================================================================

Alur: Daftar -> kode 6 digit dikirim ke email -> input kode di /profile -> akun jadi.
Login Google tidak pakai OTP (email sudah diverifikasi Google).

SETUP (pilih salah satu penyedia email):

A) BREVO API (disarankan untuk Vercel, ada kuota gratis harian)
   1. Daftar di https://app.brevo.com/ lalu verifikasi emailmu.
   2. Tambah sender: Senders, Domains & Dedicated IPs > Senders > Add a sender,
      lalu klik link verifikasi yang dikirim ke email sender itu.
   3. Buat API key: https://app.brevo.com/settings/keys/api > Generate a new API key.
   4. Isi env: BREVO_API_KEY=<key>, MAIL_FROM=<email sender yang sudah terverifikasi>

B) GMAIL SMTP
   1. Aktifkan verifikasi 2 langkah: https://myaccount.google.com/signinoptions/twosv
   2. Buat App Password: https://myaccount.google.com/apppasswords
   3. Isi env: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465,
      SMTP_USER=<gmail kamu>, SMTP_PASS=<app password 16 huruf>, MAIL_FROM=<gmail kamu>

WAJIB DI VERCEL: UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN, karena kode OTP
disimpan di Redis (kedaluwarsa otomatis 10 menit).
Setelah mengubah env di Vercel, lakukan Redeploy. Lalu jalankan: npm install

Endpoint:
  POST /auth/register    {name,email,password} -> {otpRequired:true,...} + kirim email
  POST /auth/verify-otp  {email,code}          -> akun dibuat + sesi login
  POST /auth/resend-otp  {email}               -> kirim ulang (jeda 60 detik)

Aturan: kode berlaku 10 menit, salah maksimal 5x, kirim email maksimal 4x per pendaftaran.
Matikan OTP: OTP_ENABLED=false

================================================================================
KUNCI KATEGORI (AI DIKUNCI) & KATEGORI TOOLS
================================================================================
- Semua endpoint kategori "AI" dikunci: request ke /api/ai/* dibalas 403 sebelum apikey/limit
  dihitung, dan di dokumentasi tampil sebagai "AI (Terkunci)".
- Atur di settings.js -> lockedCategories: ["AI"]. Kosongkan [] untuk membuka semua kunci.
  Bisa juga lewat env LOCKED_CATEGORIES="AI,Fun" (env menang atas settings.js; kosong = buka semua).
- Sub-kategori tools berdiri sendiri tanpa awalan "Tools -": Encoding, Text, Generator, Design, Image (plus "Tools" untuk sisanya).

================================================================================
FITUR AI (MULTI-PROVIDER)
================================================================================
- Semua endpoint AI teks memakai router di plugin/lib/llm.js. Tiap model dipetakan ke urutan provider
  (OpenAI, Gemini, Groq, Mistral, DeepSeek, OpenRouter) dengan cadangan otomatis, terakhir Pollinations.
- Key diisi di .env.ai (atau Environment Variables Vercel). Provider tanpa key dilewati.
- Provider yang gagal karena key/model/saldo (401/402/403/404) dilewati 10 menit; limit/5xx/timeout 1 menit.
- Gambar AI tetap lewat Pollinations (POLLINATIONS_API_KEY di .env.otp). TTS lewat Google Translate.
- Kunci kategori AI sudah dibuka (settings.js lockedCategories: []). Kunci lagi dengan ["AI"].

================================================================================
ROBLOX GRANT PERMISSION (2 JALUR)
================================================================================
  GET /api/roblox/grant-permission-group?apikey=&robloxkey=&assetId=&groupId=      (jalur Grup)
  GET /api/roblox/grant-permission-player?apikey=&robloxkey=&assetId=&playerId=    (jalur Player ID / User ID)
  GET /api/roblox/grant-permission?apikey=&robloxkey=&assetId=&groupId=&playerId=  (gabungan, boleh salah satu atau keduanya)
Endpoint lama /grant-permission (groupId atau targetUserId) tetap kompatibel.

================================================================================
DEV PAGE (/dev) - KHUSUS ADMIN
================================================================================
Buka https://domainmu/dev lalu masuk dengan ADMIN_PASSWORD (file .env.admin atau env Vercel, minimal 12 karakter).
Tanpa ADMIN_PASSWORD halaman ini mati. Sesi admin 8 jam, cookie HttpOnly + SameSite=Strict, login dibatasi
(6 gagal = IP dikunci 15 menit). Semua perubahan disimpan di Redis (wajib Upstash di Vercel).

Fitur:
- Endpoint: nyalakan/matikan endpoint apa pun (bawaan atau custom), ubah nama/deskripsi/kategori endpoint bawaan.
- Tambah endpoint custom di kategori mana saja; ketik nama kategori baru untuk membuat kategori baru. Tipe:
    proxy  : ambil dari URL lain (GET/POST, header, body, ambil bagian JSON). Pakai {param} dan {env.NAMA_ENV}.
             Host harus tetap, alamat privat/internal diblokir (anti-SSRF), redirect diperiksa ulang.
    ai     : prompt template ke model teks (lewat router llm.js).
    image  : prompt template ke model gambar (Pollinations).
    static : isi tetap (JSON atau teks).
  Tombol "Tes" menjalankan endpoint sebelum disimpan. Endpoint bawaan selalu menang kalau path bentrok.
- Kategori: kunci/buka seluruh kategori, ganti nama kategori (memindahkan semua endpoint di dalamnya).
- User: cari, lihat pemakaian hari ini, blokir/buka blokir (dengan alasan). User yang diblokir ditolak di apikey,
  login manual, login Google, dan sesi. Email-nya tidak bisa dipakai daftar ulang.
- Info: mode penyimpanan, key provider mana yang terisi (nilainya tidak pernah ditampilkan).
Catatan: kode JavaScript bebas sengaja TIDAK ada (kalau login admin bocor, itu sama dengan eksekusi kode di server).
Perubahan terlihat di semua instance maksimal sekitar 10 detik.

================================================================================
KECEPATAN
================================================================================
- Header X-Response-Time di setiap respons = lama proses di server. X-Cache: HIT/MISS untuk kategori yang di-cache.
- vercel.json regions: ["sin1"] (Singapura). Samakan region Upstash Redis dengan region fungsi (default Vercel: Washington D.C.).
- Plugin lazy-load lewat plugin-manifest.json: modul berat (canvas dll) baru dimuat saat endpoint-nya dipanggil.
  Setelah menambah/mengubah file di plugin/, jalankan: npm run manifest (di Vercel otomatis lewat vercel-build).
  Manifest usang otomatis diabaikan (dimuat penuh seperti dulu). Matikan: LAZY_PLUGINS=false.
- Apikey dan data dev dilayani dari memori (disegarkan di belakang layar); hitung pemakaian harian tidak menunggu Redis
  selama pemakaian < 80% limit. Mendekati limit tetap pakai angka pasti dari Redis.
- Cache respons JSON sukses per kategori: settings.js -> cacheTtl { Primbon: 86400, Info: 60, Finance: 30, Anime: 300 }.
- AI: kalau provider pertama belum menjawab dalam 3,5 dtk (LLM_HEDGE_MS), cadangan dijalankan paralel; yang tercepat dipakai.
  Batas panjang jawaban LLM_MAX_TOKENS (default 1500): jawaban lebih pendek = lebih cepat.
