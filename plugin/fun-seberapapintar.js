const JULUKAN = [
  { min: 0, label: "Lagi healing dari mikir keras" },
  { min: 40, label: "Otak masih pemanasan" },
  { min: 60, label: "Standar aman, lumayan diandalkan" },
  { min: 80, label: "Mendekati jenius grup" },
  { min: 95, label: "Kandidat kuat profesor" }
];

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function julukanFor(skor) {
  let result = JULUKAN[0].label;
  for (const j of JULUKAN) if (skor >= j.min) result = j.label;
  return result;
}

module.exports = {
  name: "Seberapa Pintar",
  desc: "Hiburan: generate skor 'IQ' parodi dari nama beserta julukan lucunya, untuk fun bot grup. Hasil konsisten untuk nama yang sama.",
  category: "Fun",
  path: "/api/fun/seberapapintar?apikey=&nama=Budi",
  async run(req, res) {
    const { apikey, nama } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!nama) {
      return res.status(400).json({ status: false, error: "Parameter 'nama' wajib diisi" });
    }

    const h = hashString(String(nama).toLowerCase().trim());
    const skor = h % 101;

    return res.status(200).json({
      status: true,
      nama,
      result: { skor, julukan: julukanFor(skor) }
    });
  }
};
