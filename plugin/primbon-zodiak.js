const SIGNS = [
  { nama: "Capricorn", mulai: [12, 22], selesai: [1, 19], sifat: "Disiplin, ambisius, dan bertanggung jawab." },
  { nama: "Aquarius", mulai: [1, 20], selesai: [2, 18], sifat: "Independen, inovatif, dan humanis." },
  { nama: "Pisces", mulai: [2, 19], selesai: [3, 20], sifat: "Imajinatif, empatik, dan intuitif." },
  { nama: "Aries", mulai: [3, 21], selesai: [4, 19], sifat: "Berani, energik, dan kompetitif." },
  { nama: "Taurus", mulai: [4, 20], selesai: [5, 20], sifat: "Sabar, dapat diandalkan, dan menyukai kenyamanan." },
  { nama: "Gemini", mulai: [5, 21], selesai: [6, 20], sifat: "Komunikatif, ingin tahu, dan adaptif." },
  { nama: "Cancer", mulai: [6, 21], selesai: [7, 22], sifat: "Emosional, penyayang, dan protektif." },
  { nama: "Leo", mulai: [7, 23], selesai: [8, 22], sifat: "Percaya diri, dermawan, dan berjiwa pemimpin." },
  { nama: "Virgo", mulai: [8, 23], selesai: [9, 22], sifat: "Analitis, teliti, dan praktis." },
  { nama: "Libra", mulai: [9, 23], selesai: [10, 22], sifat: "Diplomatis, menyukai keseimbangan, dan sosial." },
  { nama: "Scorpio", mulai: [10, 23], selesai: [11, 21], sifat: "Penuh gairah, misterius, dan tekun." },
  { nama: "Sagittarius", mulai: [11, 22], selesai: [12, 21], sifat: "Optimis, suka berpetualang, dan terus terang." }
];

function findSign(month, day) {
  for (const s of SIGNS) {
    const [m1, d1] = s.mulai;
    const [m2, d2] = s.selesai;
    if (m1 === m2) {
      if (month === m1 && day >= d1 && day <= d2) return s;
    } else if (m1 > m2) {
      if ((month === m1 && day >= d1) || (month === m2 && day <= d2)) return s;
    } else if ((month === m1 && day >= d1) || (month === m2 && day <= d2)) {
      return s;
    }
  }
  return null;
}

module.exports = {
  name: "Zodiak (Western)",
  desc: "Tentukan rasi zodiak Barat dari tanggal lahir beserta sifat umumnya (bukan ramalan harian). Parameter: tgl, bln.",
  category: "Primbon",
  path: "/api/primbon/zodiak?apikey=&tgl=17&bln=8",
  async run(req, res) {
    const { apikey, tgl, bln } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const d = parseInt(tgl, 10), m = parseInt(bln, 10);
    if (!tgl || !bln || Number.isNaN(d) || Number.isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) {
      return res.status(400).json({ status: false, error: "Parameter 'tgl' dan 'bln' wajib diisi dan valid" });
    }

    try {
      const sign = findSign(m, d);
      if (!sign) {
        return res.status(400).json({ status: false, error: "Tanggal tidak valid untuk perhitungan zodiak" });
      }
      return res.status(200).json({ status: true, result: { zodiak: sign.nama, sifatUmum: sign.sifat } });
    } catch (error) {
      console.error("Zodiak Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal menghitung: " + String(error.message || error).slice(0, 300) });
    }
  }
};
