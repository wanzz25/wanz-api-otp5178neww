const KAPANKAH_LIST = [
  "3 hari lagi",
  "2 minggu lagi",
  "2 bulan lagi",
  "5 tahun lagi",
  "Besok pagi",
  "Tahun depan",
  "Belum bisa diprediksi",
  "Lebih cepat dari yang kamu kira"
];

module.exports = {
  name: "Kapankah (Kerang Ajaib)",
  desc: "Prediksi waktu acak ala Kerang Ajaib.",
  category: "Fun",
  path: "/api/fun/kapankah?apikey=&text=saya menikah",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    const result = KAPANKAH_LIST[Math.floor(Math.random() * KAPANKAH_LIST.length)];
    return res.status(200).json({ status: true, text, result });
  }
};
