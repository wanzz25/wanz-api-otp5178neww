const BISAKAH_LIST = [
  "Bisa banget",
  "Kurang yakin",
  "Tidak bisa",
  "Bisa kalau berusaha",
  "Sangat mungkin",
  "50:50",
  "Butuh usaha ekstra"
];

module.exports = {
  name: "Bisakah (Kerang Ajaib)",
  desc: "Jawaban peluang acak ala Kerang Ajaib.",
  category: "Fun",
  path: "/api/fun/bisakah?apikey=&text=saya jadi miliarder",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    const result = BISAKAH_LIST[Math.floor(Math.random() * BISAKAH_LIST.length)];
    return res.status(200).json({ status: true, text, result });
  }
};
