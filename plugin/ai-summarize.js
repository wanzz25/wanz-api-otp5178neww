const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Summarize",
  desc: "Ringkas teks panjang menjadi poin-poin utama.",
  category: "AI",
  path: "/api/ai/summarize?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "openai", system: "Ringkaslah teks berikut menjadi poin-poin utama (bullet points) yang padat dan akurat dalam bahasa Indonesia" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Summarize Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
