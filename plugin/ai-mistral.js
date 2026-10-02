const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Mistral",
  desc: "Chat dengan model AI Mistral Large.",
  category: "AI",
  path: "/api/ai/mistral?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "mistral" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Mistral Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
