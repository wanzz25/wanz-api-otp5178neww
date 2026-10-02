const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Blackbox Coder",
  desc: "Tanya jawab pemrograman dengan contoh kode lengkap.",
  category: "AI",
  path: "/api/ai/blackbox?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await textGen(text, { model: "qwen-coder", system: "Anda adalah asisten pemrograman tingkat lanjut yang selalu menyertakan contoh kode lengkap" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Blackbox Coder Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
