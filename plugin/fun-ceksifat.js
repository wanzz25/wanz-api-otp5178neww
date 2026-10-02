const SIFAT_POSITIF = ["Setia", "Pekerja keras", "Humoris", "Penyayang", "Cerdas", "Supel", "Kreatif", "Sabar", "Pemberani", "Dermawan"];
const SIFAT_NEGATIF = ["Keras kepala", "Suka menunda", "Gampang baper", "Moody", "Pelupa", "Boros", "Gengsian", "Overthinking"];

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

module.exports = {
  name: "Cek Sifat",
  desc: "Hiburan: generate persentase sifat positif/negatif dari nama, untuk fun bot grup. Hasil konsisten untuk nama yang sama.",
  category: "Fun",
  path: "/api/fun/ceksifat?apikey=&nama=Budi",
  async run(req, res) {
    const { apikey, nama } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!nama) {
      return res.status(400).json({ status: false, error: "Parameter 'nama' wajib diisi" });
    }

    const h = hashString(String(nama).toLowerCase().trim());
    const persenPositif = 30 + (h % 61); // 30-90
    const sifatUtama = SIFAT_POSITIF[h % SIFAT_POSITIF.length];
    const sifatMinor = SIFAT_NEGATIF[Math.floor(h / SIFAT_POSITIF.length) % SIFAT_NEGATIF.length];

    return res.status(200).json({
      status: true,
      nama,
      result: {
        positif: persenPositif,
        negatif: 100 - persenPositif,
        sifatMenonjol: sifatUtama,
        sifatPerluDiperbaiki: sifatMinor
      }
    });
  }
};
