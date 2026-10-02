const APAKAH_LIST = [
  "Iya",
  "Tidak",
  "Mungkin saja",
  "Mustahil",
  "100% Pasti",
  "Kemungkinan besar iya",
  "Sepertinya tidak",
  "Bisa jadi"
];

module.exports = {
  name: "Apakah (Kerang Ajaib)",
  desc: "Jawaban acak ala Kerang Ajaib untuk pertanyaan ya/tidak.",
  category: "Fun",
  path: "/api/fun/apakah?apikey=&text=besok saya libur",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    const result = APAKAH_LIST[Math.floor(Math.random() * APAKAH_LIST.length)];
    return res.status(200).json({ status: true, text, result });
  }
};
