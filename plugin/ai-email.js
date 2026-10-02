const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Email Generator",
  desc: "Buat draf email profesional lengkap dengan subjek, dari tujuan yang dijelaskan singkat.",
  category: "AI",
  path: "/api/ai/email-generator?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "openai", system: "Buatkan draf email profesional berbahasa Indonesia lengkap dengan baris Subjek dan Isi Email, berdasarkan tujuan yang diberikan pengguna" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Email Generator Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
