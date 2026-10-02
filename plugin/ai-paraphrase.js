const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Paraphrase",
  desc: "Tulis ulang (parafrase) teks dengan gaya bahasa tertentu. Atur mode=formal|santai (opsional).",
  category: "AI",
  path: "/api/ai/paraphrase?apikey=&text=&mode=formal",
  async run(req, res) {
    const { apikey, text, mode } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = await textGen(text, { model: "openai", system: `Tulis ulang (parafrase) teks berikut dengan gaya bahasa ${mode || "netral"} tanpa mengubah makna aslinya, agar bebas plagiarisme. Jawab hanya dengan hasil parafrasenya.` });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Paraphrase Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
