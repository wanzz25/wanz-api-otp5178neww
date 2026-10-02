const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Dokter",
  desc: "Analisis gejala kesehatan awal (bukan pengganti diagnosis dokter sungguhan). Kirim gejala lewat text.",
  category: "AI",
  path: "/api/ai/dokter-ai?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "openai", system: "Anda adalah asisten edukasi medis. Analisis gejala yang diberikan, sebutkan kemungkinan penyebab umum, pertolongan pertama, dan kapan harus ke dokter/RS. Selalu ingatkan ini bukan pengganti diagnosis dokter sungguhan" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Dokter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
