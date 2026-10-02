const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Copilot Style",
  desc: "Asisten AI bergaya Microsoft Copilot, jawaban terstruktur dan informatif.",
  category: "AI",
  path: "/api/ai/copilot?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "searchgpt", system: "Kamu adalah asisten AI bergaya Microsoft Copilot: terstruktur, informatif, dan ringkas" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Copilot Style Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
