const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached } = require("./lib/canvas-common");

const TAHUN = 2026;
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const NAMA_HARI = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

const LIBUR = {
  "1-1": { nama: "Tahun Baru Masehi", tipe: "nasional" },
  "1-16": { nama: "Isra Mi'raj Nabi Muhammad SAW", tipe: "keagamaan" },
  "2-16": { nama: "Cuti Bersama Imlek", tipe: "cuti" },
  "2-17": { nama: "Tahun Baru Imlek 2577 Kongzili", tipe: "budaya" },
  "3-18": { nama: "Cuti Bersama Nyepi", tipe: "cuti" },
  "3-19": { nama: "Hari Raya Nyepi (Tahun Baru Saka 1948)", tipe: "keagamaan" },
  "3-20": { nama: "Cuti Bersama Idul Fitri", tipe: "cuti" },
  "3-21": { nama: "Hari Raya Idul Fitri 1447 H", tipe: "keagamaan" },
  "3-22": { nama: "Hari Raya Idul Fitri 1447 H", tipe: "keagamaan" },
  "3-23": { nama: "Cuti Bersama Idul Fitri", tipe: "cuti" },
  "3-24": { nama: "Cuti Bersama Idul Fitri", tipe: "cuti" },
  "4-3": { nama: "Wafat Yesus Kristus (Jumat Agung)", tipe: "keagamaan" },
  "4-5": { nama: "Kebangkitan Yesus Kristus (Paskah)", tipe: "keagamaan" },
  "5-1": { nama: "Hari Buruh Internasional", tipe: "nasional" },
  "5-14": { nama: "Kenaikan Yesus Kristus", tipe: "keagamaan" },
  "5-15": { nama: "Cuti Bersama Kenaikan Yesus Kristus", tipe: "cuti" },
  "5-27": { nama: "Hari Raya Idul Adha 1447 H", tipe: "keagamaan" },
  "5-28": { nama: "Cuti Bersama Idul Adha", tipe: "cuti" },
  "5-31": { nama: "Hari Raya Waisak 2570 BE", tipe: "keagamaan" },
  "6-1": { nama: "Hari Lahir Pancasila", tipe: "nasional" },
  "6-16": { nama: "Tahun Baru Islam 1448 H", tipe: "keagamaan" },
  "8-17": { nama: "Hari Kemerdekaan Republik Indonesia", tipe: "nasional" },
  "8-25": { nama: "Maulid Nabi Muhammad SAW", tipe: "keagamaan" },
  "12-24": { nama: "Cuti Bersama Natal", tipe: "cuti" },
  "12-25": { nama: "Hari Raya Natal", tipe: "keagamaan" }
};

const WARNA = {
  merah: "#A6192E", merahTua: "#7A0F20", krem: "#FBF6EC", kremKartu: "#FFFDF9",
  tinta: "#221A17", emas: "#B7862C", emasLembut: "#EFDFB8", batik: "#C89B4A",
  garis: "#E7DCC6", abu: "#8A8078", minggu: "#B5473E",
  tipe: { nasional: "#A6192E", keagamaan: "#B7862C", budaya: "#5B7A6B", cuti: "#2E6E7E" },
  tipeTeks: { nasional: "#FFFFFF", keagamaan: "#3A2A05", budaya: "#FFFFFF", cuti: "#FFFFFF" }
};

const FONTS = [
  { file: "wanz-kal-inter-reg.woff2", url: "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.woff2", family: "Inter" },
  { file: "wanz-kal-inter-semibold.woff2", url: "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-SemiBold.woff2", family: "Inter SemiBold" },
  { file: "wanz-kal-inter-bold.woff2", url: "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.woff2", family: "Inter Bold" },
  { file: "wanz-kal-inter-extrabold.woff2", url: "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-ExtraBold.woff2", family: "Inter ExtraBold" },
  { file: "wanz-kal-manrope-bold.ttf", url: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/manrope@0.4.0/700Bold/Manrope_700Bold.ttf", family: "Manrope Bold" },
  { file: "wanz-kal-manrope-extrabold.ttf", url: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/manrope@0.4.0/800ExtraBold/Manrope_800ExtraBold.ttf", family: "Manrope ExtraBold" }
];

let fontsReady = false;
async function pastikanFont() {
  if (fontsReady) return;
  for (const f of FONTS) {
    try {
      const p = await ensureCached(f.url, f.file);
      GlobalFonts.registerFromPath(p, f.family);
    } catch (e) {
      console.warn(`Font ${f.file} gagal dimuat, pakai fallback sistem:`, e.message);
    }
  }
  fontsReady = true;
}

function jumlahHariDiBulan(bulanNum) {
  return new Date(TAHUN, bulanNum, 0).getDate();
}
function offsetHariPertama(bulanNum) {
  return (new Date(TAHUN, bulanNum - 1, 1).getDay() + 6) % 7;
}
function liburDiBulan(bulanNum) {
  return Object.keys(LIBUR)
    .filter((k) => parseInt(k.split("-")[0], 10) === bulanNum)
    .map((k) => ({ tgl: parseInt(k.split("-")[1], 10), ...LIBUR[k] }))
    .sort((a, b) => a.tgl - b.tgl);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function gambarMotifBatik(ctx, x, y, w, h, opacity) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = WARNA.batik;
  ctx.lineWidth = 2;
  const langkah = 34;
  for (let d = -h; d < w + h; d += langkah) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
    ctx.stroke();
  }
  ctx.fillStyle = WARNA.batik;
  for (let yy = y + 17; yy < y + h; yy += 34) {
    for (let xx = x + 17; xx < x + w; xx += 34) {
      ctx.beginPath();
      ctx.arc(xx, yy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function gambarHeader(ctx, x, y, w, opts) {
  const tinggi = opts.tinggi;
  const grad = ctx.createLinearGradient(0, y, 0, y + tinggi);
  grad.addColorStop(0, WARNA.merahTua);
  grad.addColorStop(0.7, WARNA.merah);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, tinggi);
  gambarMotifBatik(ctx, x, y, w, tinggi, 0.16);

  const tengah = x + w / 2;
  ctx.save();
  const eyebrow = "TAHUN 1948 SAKA  ·  1447\u20131448 HIJRIAH";
  ctx.fillStyle = "#EFDFB8";
  ctx.textAlign = "left";
  ctx.font = "13px 'Inter Bold', sans-serif";
  const spasiEyebrow = eyebrow.split("").join(" ");
  const lebarEyebrow = ctx.measureText(spasiEyebrow).width;
  ctx.fillText(spasiEyebrow, tengah - lebarEyebrow / 2, y + 56);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#FBF6EC";
  ctx.font = "64px 'Manrope ExtraBold', sans-serif";
  ctx.fillText(opts.judul, tengah, y + 128);

  if (opts.subjudulBaris?.length) {
    ctx.fillStyle = "#F3D9D4";
    ctx.font = "17px 'Inter Bold', sans-serif";
    let sy = y + 168;
    opts.subjudulBaris.forEach((baris) => {
      ctx.fillText(baris, tengah, sy);
      sy += 26;
    });
  }

  if (opts.statistik) {
    const gapAntarStat = 130;
    const totalLebar = (opts.statistik.length - 1) * gapAntarStat;
    let sx = tengah - totalLebar / 2;
    opts.statistik.forEach((s) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "32px 'Manrope ExtraBold', sans-serif";
      ctx.fillText(s.angka, sx, y + tinggi - 62);
      ctx.fillStyle = "#F3D9D4";
      ctx.font = "11px 'Inter Bold', sans-serif";
      ctx.fillText(s.label.toUpperCase(), sx, y + tinggi - 40);
      sx += gapAntarStat;
    });
  }
}

function gambarLegenda(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = WARNA.kremKartu;
  ctx.fill();
  ctx.strokeStyle = WARNA.garis;
  ctx.lineWidth = 1;
  ctx.stroke();

  const item = [
    { label: "Hari Nasional", warna: WARNA.tipe.nasional },
    { label: "Hari Besar Keagamaan", warna: WARNA.tipe.keagamaan },
    { label: "Hari Budaya", warna: WARNA.tipe.budaya },
    { label: "Cuti Bersama", warna: WARNA.tipe.cuti }
  ];

  ctx.font = "15px 'Inter SemiBold', sans-serif";
  ctx.textBaseline = "middle";
  const lebarTiap = item.map((it) => 14 + 10 + ctx.measureText(it.label).width);
  const gap = 40;
  const totalLebar = lebarTiap.reduce((a, b) => a + b, 0) + gap * (item.length - 1);
  let cx = x + (w - totalLebar) / 2;
  const cy = y + h / 2;

  item.forEach((it, i) => {
    ctx.beginPath();
    ctx.arc(cx + 7, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = it.warna;
    ctx.fill();
    ctx.fillStyle = WARNA.tinta;
    ctx.textAlign = "left";
    ctx.fillText(it.label, cx + 24, cy + 1);
    cx += lebarTiap[i] + gap;
  });
  ctx.textBaseline = "alphabetic";
}

function hitungTinggiKartuBulan(bulanNum, w, skala) {
  const s = skala || 1;
  const tinggiHead = 58 * s;
  const headerHariY = tinggiHead + 20 * s;
  const offset = offsetHariPertama(bulanNum);
  const totalHari = jumlahHariDiBulan(bulanNum);
  const baris = Math.ceil((offset + totalHari) / 7);
  const tinggiSel = 34 * s;
  const grafikMulaiY = headerHariY + 16 * s;
  const yTabelSelesai = grafikMulaiY + tinggiSel * baris + 8 * s;

  const libur = liburDiBulan(bulanNum);
  const tinggiBarisDaftar = 19 * s;
  const tinggiDaftar = libur.length === 0 ? 12 * s : libur.length * tinggiBarisDaftar;

  const yDaftarMulai = yTabelSelesai + 22 * s;
  return yDaftarMulai + tinggiDaftar + 16 * s;
}

function gambarKartuBulan(ctx, x, y, w, tinggiKartu, bulanNum, namaBulan, skala) {
  const s = skala || 1;
  const h = tinggiKartu;

  roundRect(ctx, x, y, w, h, 18 * s);
  ctx.fillStyle = WARNA.kremKartu;
  ctx.fill();
  ctx.strokeStyle = WARNA.garis;
  ctx.lineWidth = 1;
  ctx.stroke();

  const tinggiHead = 58 * s;
  ctx.save();
  roundRect(ctx, x, y, w, h, 18 * s);
  ctx.clip();
  ctx.fillStyle = WARNA.emasLembut;
  ctx.fillRect(x, y, w, tinggiHead);
  ctx.restore();

  const libur = liburDiBulan(bulanNum);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WARNA.merahTua;
  ctx.font = `${22 * s}px 'Manrope Bold', sans-serif`;
  ctx.fillText(namaBulan, x + 18 * s, y + 36 * s);

  const labelJumlah = `${libur.length} libur`;
  ctx.font = `${11 * s}px 'Inter Bold', sans-serif`;
  const lebarLabel = ctx.measureText(labelJumlah).width;
  const padPill = 10 * s;
  const pillW = lebarLabel + padPill * 2;
  const pillH = 22 * s;
  const pillX = x + w - pillW - 16 * s;
  const pillY = y + 18 * s;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.fillStyle = WARNA.emas;
  ctx.textAlign = "center";
  ctx.fillText(labelJumlah, pillX + pillW / 2, pillY + pillH / 2 + 4 * s);

  const kolLebar = w / 7;
  const headerHariY = y + tinggiHead + 20 * s;
  ctx.font = `${11 * s}px 'Inter Bold', sans-serif`;
  ctx.fillStyle = WARNA.abu;
  ctx.textAlign = "center";
  NAMA_HARI.forEach((h2, i) => {
    ctx.fillText(h2, x + kolLebar * i + kolLebar / 2, headerHariY);
  });

  const offset = offsetHariPertama(bulanNum);
  const totalHari = jumlahHariDiBulan(bulanNum);
  const baris = Math.ceil((offset + totalHari) / 7);
  const tinggiSel = 34 * s;
  const grafikMulaiY = headerHariY + 16 * s;

  const liburMap = {};
  libur.forEach((l) => (liburMap[l.tgl] = l));

  for (let i = 0; i < totalHari; i++) {
    const tgl = i + 1;
    const posisi = offset + i;
    const barisI = Math.floor(posisi / 7);
    const kolom = posisi % 7;
    const cx = x + kolLebar * kolom + kolLebar / 2;
    const cy = grafikMulaiY + tinggiSel * barisI + tinggiSel / 2;

    const info = liburMap[tgl];
    if (info) {
      ctx.beginPath();
      ctx.arc(cx, cy, 13 * s, 0, Math.PI * 2);
      ctx.fillStyle = WARNA.tipe[info.tipe];
      ctx.fill();
      ctx.fillStyle = WARNA.tipeTeks[info.tipe];
      ctx.font = `${13 * s}px 'Inter Bold', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(tgl), cx, cy + 1);
      ctx.textBaseline = "alphabetic";
    } else {
      ctx.fillStyle = kolom === 6 ? WARNA.minggu : WARNA.tinta;
      ctx.font = `${13 * s}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(String(tgl), cx, cy + 4 * s);
    }
  }

  const yTabelSelesai = grafikMulaiY + tinggiSel * baris + 8 * s;
  ctx.strokeStyle = WARNA.garis;
  ctx.setLineDash([4 * s, 3 * s]);
  ctx.beginPath();
  ctx.moveTo(x + 18 * s, yTabelSelesai);
  ctx.lineTo(x + w - 18 * s, yTabelSelesai);
  ctx.stroke();
  ctx.setLineDash([]);

  let yDaftar = yTabelSelesai + 22 * s;
  ctx.textAlign = "left";
  if (libur.length === 0) {
    ctx.fillStyle = WARNA.abu;
    ctx.font = `italic ${12 * s}px 'Inter', sans-serif`;
    ctx.fillText("Tidak ada tanggal merah bulan ini.", x + 18 * s, yDaftar);
  } else {
    libur.forEach((l) => {
      ctx.fillStyle = WARNA.merahTua;
      ctx.font = `${12 * s}px 'Inter ExtraBold', sans-serif`;
      ctx.fillText(String(l.tgl), x + 18 * s, yDaftar);
      ctx.fillStyle = "#4B4137";
      ctx.font = `${12 * s}px 'Inter', sans-serif`;
      ctx.fillText(l.nama, x + 44 * s, yDaftar);
      yDaftar += 19 * s;
    });
  }
}

function renderTahun() {
  const lebarKartu = 700;
  const gap = 34;
  const kolom = 3;
  const margin = 40;
  const lebarKanvas = margin * 2 + lebarKartu * kolom + gap * (kolom - 1);
  const skalaKartu = 1.6;
  const tinggiHeader = 360;
  const tinggiLegenda = 74;
  const jumlahBaris = Math.ceil(12 / kolom);

  const tinggiTiapKartu = [];
  for (let b = 1; b <= 12; b++) tinggiTiapKartu.push(hitungTinggiKartuBulan(b, lebarKartu, skalaKartu));

  const tinggiTiapBaris = [];
  for (let brs = 0; brs < jumlahBaris; brs++) {
    tinggiTiapBaris.push(Math.max(...tinggiTiapKartu.slice(brs * kolom, brs * kolom + kolom)));
  }

  const totalTinggiKartu = tinggiTiapBaris.reduce((a, b) => a + b, 0) + gap * (jumlahBaris - 1);
  const tinggiKanvas = tinggiHeader + 24 + tinggiLegenda + 40 + totalTinggiKartu + 60;

  const canvas = createCanvas(lebarKanvas, tinggiKanvas);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = WARNA.krem;
  ctx.fillRect(0, 0, lebarKanvas, tinggiKanvas);

  gambarHeader(ctx, 0, 0, lebarKanvas, {
    tinggi: tinggiHeader,
    judul: `Kalender Indonesia ${TAHUN}`,
    subjudulBaris: [
      "Dua belas bulan lengkap dengan hari libur nasional, hari besar",
      "keagamaan, perayaan budaya, dan cuti bersama."
    ],
    statistik: [
      { angka: "17", label: "Libur Nasional" },
      { angka: "8", label: "Cuti Bersama" },
      { angka: "25", label: "Total Tanggal Merah" }
    ]
  });

  const legendaY = tinggiHeader - 26;
  gambarLegenda(ctx, margin, legendaY, lebarKanvas - margin * 2, tinggiLegenda);

  let yBaris = legendaY + tinggiLegenda + 40;
  for (let brs = 0; brs < jumlahBaris; brs++) {
    for (let kol = 0; kol < kolom; kol++) {
      const b = brs * kolom + kol;
      if (b >= 12) continue;
      const x = margin + kol * (lebarKartu + gap);
      gambarKartuBulan(ctx, x, yBaris, lebarKartu, tinggiTiapKartu[b], b + 1, NAMA_BULAN[b], skalaKartu);
    }
    yBaris += tinggiTiapBaris[brs] + gap;
  }

  return canvas.encode("png");
}

function renderBulan(bulanNum) {
  const margin = 40;
  const lebarKartu = 760;
  const lebarKanvas = margin * 2 + lebarKartu;
  const skalaKartu = 2.1;
  const tinggiHeader = 300;
  const tinggiLegenda = 74;
  const tinggiKartu = hitungTinggiKartuBulan(bulanNum, lebarKartu, skalaKartu);
  const tinggiKanvas = tinggiHeader + 24 + tinggiLegenda + 40 + tinggiKartu + 50;

  const canvas = createCanvas(lebarKanvas, tinggiKanvas);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = WARNA.krem;
  ctx.fillRect(0, 0, lebarKanvas, tinggiKanvas);

  const namaBulan = NAMA_BULAN[bulanNum - 1];
  const libur = liburDiBulan(bulanNum);

  gambarHeader(ctx, 0, 0, lebarKanvas, {
    tinggi: tinggiHeader,
    judul: `${namaBulan} ${TAHUN}`,
    subjudulBaris: [
      "Kalender Indonesia dengan hari libur nasional, hari besar",
      "keagamaan, perayaan budaya, dan cuti bersama."
    ],
    statistik: [{ angka: String(libur.length), label: "Tanggal Merah Bulan Ini" }]
  });

  const legendaY = tinggiHeader - 26;
  gambarLegenda(ctx, margin, legendaY, lebarKanvas - margin * 2, tinggiLegenda);

  const kartuY = legendaY + tinggiLegenda + 40;
  gambarKartuBulan(ctx, margin, kartuY, lebarKartu, tinggiKartu, bulanNum, namaBulan, skalaKartu);

  return canvas.encode("png");
}

const NAMA_KE_NOMOR = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
};

module.exports = {
  name: "Kalender Indonesia 2026",
  desc: "Gambar kalender Indonesia 2026 bertema batik, lengkap dengan hari libur nasional, keagamaan, budaya, dan cuti bersama. mode=tahun untuk 12 bulan sekaligus, mode=bulan&bulan=juli untuk 1 bulan.",
  category: "Tools",
  path: "/api/tools/kalender?apikey=&mode=bulan&bulan=januari",
  async run(req, res) {
    const { apikey, mode, bulan } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    const modePilihan = mode === "tahun" ? "tahun" : "bulan";

    try {
      await pastikanFont();

      let buffer;
      if (modePilihan === "tahun") {
        buffer = await renderTahun();
      } else {
        const nama = String(bulan || "januari").toLowerCase();
        const nomor = NAMA_KE_NOMOR[nama];
        if (!nomor) {
          return res.status(400).json({
            status: false,
            error: "Parameter 'bulan' tidak dikenali. Gunakan: " + Object.keys(NAMA_KE_NOMOR).join(", ")
          });
        }
        buffer = await renderBulan(nomor);
      }

      res.setHeader("Cache-Control", "public, max-age=86400");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Kalender Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat kalender: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
