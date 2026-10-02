const SHIO = ["Monyet", "Ayam", "Anjing", "Babi", "Tikus", "Kerbau", "Macan", "Kelinci", "Naga", "Ular", "Kuda", "Kambing"];
const ELEMEN = ["Logam", "Logam", "Air", "Air", "Kayu", "Kayu", "Api", "Api", "Tanah", "Tanah"];

const WATAK_SHIO = {
  Tikus: "Cerdas, lincah, dan pandai membaca peluang.",
  Kerbau: "Ulet, dapat diandalkan, dan teguh pada prinsip.",
  Macan: "Berani, penuh percaya diri, dan suka tantangan.",
  Kelinci: "Lembut, hati-hati, dan pandai menjaga hubungan.",
  Naga: "Karismatik, ambisius, dan punya jiwa pemimpin.",
  Ular: "Bijaksana, intuitif, dan penuh misteri.",
  Kuda: "Energik, bebas, dan suka petualangan.",
  Kambing: "Kreatif, penyayang, dan mudah berempati.",
  Monyet: "Cerdik, lucu, dan pandai mencari solusi kreatif.",
  Ayam: "Rajin, teliti, dan percaya diri.",
  Anjing: "Setia, jujur, dan pembela kebenaran.",
  Babi: "Tulus, murah hati, dan menikmati hidup."
};

module.exports = {
  name: "Shio (Zodiak China)",
  desc: "Hitung shio (zodiak Tionghoa) dan unsur elemen berdasarkan tahun lahir Masehi.",
  category: "Primbon",
  path: "/api/primbon/shio?apikey=&tahun=2000",
  async run(req, res) {
    const { apikey, tahun } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const y = parseInt(tahun, 10);
    if (!tahun || Number.isNaN(y)) {
      return res.status(400).json({ status: false, error: "Parameter 'tahun' wajib diisi" });
    }

    try {
      const shio = SHIO[((y % 12) + 12) % 12];
      const elemen = ELEMEN[((y % 10) + 10) % 10];
      return res.status(200).json({
        status: true,
        result: { tahun: y, shio, elemen: `${elemen} ${shio}`, watak: WATAK_SHIO[shio] }
      });
    } catch (error) {
      console.error("Shio Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal menghitung shio: " + String(error.message || error).slice(0, 300) });
    }
  }
};
