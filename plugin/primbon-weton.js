const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NEPTU_HARI = { Minggu: 5, Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9 };
const PASARAN = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];
const NEPTU_PASARAN = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 };

// Dikalibrasi terhadap fakta sejarah yang banyak dikutip: 17 Agustus 1945 jatuh pada
// weton Jumat Legi. Offset ini disesuaikan supaya perhitungan cocok dengan patokan itu.
const PASARAN_EPOCH = new Date(Date.UTC(1900, 0, 1));
const PASARAN_OFFSET = 1;

const WATAK_NEPTU = [
  { max: 10, watak: "Tenang, sabar, dan suka mengalah demi kedamaian." },
  { max: 13, watak: "Pekerja keras, mandiri, dan punya semangat juang tinggi." },
  { max: 16, watak: "Berwibawa, tegas, dan cenderung jadi pemimpin di lingkungannya." },
  { max: 18, watak: "Cerdas, kreatif, namun kadang keras kepala." }
];

function watakFromNeptu(neptu) {
  for (const w of WATAK_NEPTU) if (neptu <= w.max) return w.watak;
  return "Berkarisma kuat, ambisius, dan punya banyak ide besar.";
}

module.exports = {
  name: "Weton Jawa",
  desc: "Hitung hari lahir Masehi, pasaran Jawa (Legi/Pahing/Pon/Wage/Kliwon), neptu, dan watak dasar berdasarkan tanggal lahir. Parameter: tgl, bln, thn.",
  category: "Primbon",
  path: "/api/primbon/weton-jawa?apikey=&tgl=17&bln=8&thn=1998",
  async run(req, res) {
    const { apikey, tgl, bln, thn } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!tgl || !bln || !thn) {
      return res.status(400).json({ status: false, error: "Parameter 'tgl', 'bln', dan 'thn' wajib diisi" });
    }

    const date = new Date(Date.UTC(parseInt(thn, 10), parseInt(bln, 10) - 1, parseInt(tgl, 10)));
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ status: false, error: "Tanggal tidak valid" });
    }

    try {
      const hari = HARI[date.getUTCDay()];
      const diffDays = Math.round((date - PASARAN_EPOCH) / 86400000);
      const pasaranIdx = (((diffDays + PASARAN_OFFSET) % 5) + 5) % 5;
      const pasaran = PASARAN[pasaranIdx];
      const neptu = NEPTU_HARI[hari] + NEPTU_PASARAN[pasaran];

      return res.status(200).json({
        status: true,
        result: {
          tanggal: `${tgl}-${bln}-${thn}`,
          hari,
          pasaran,
          weton: `${hari} ${pasaran}`,
          neptu,
          watak: watakFromNeptu(neptu)
        }
      });
    } catch (error) {
      console.error("Weton Jawa Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal menghitung weton: " + String(error.message || error).slice(0, 300) });
    }
  }
};
