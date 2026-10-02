const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Pakar Hukum",
  desc: "Analisis kasus hukum sederhana berdasarkan KUHP/KUHPerdata/UU ITE (bukan nasihat hukum resmi).",
  category: "AI",
  path: "/api/ai/pakar-hukum?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "openai", system: "Anda adalah konsultan hukum Indonesia. Analisis kasus berdasarkan KUHP, KUHPerdata, dan UU ITE beserta langkah hukum yang bisa diambil. Selalu ingatkan ini bukan pengganti nasihat hukum resmi dari advokat" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Pakar Hukum Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
