const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Code Explain",
  desc: "Jelaskan alur kerja sebuah potongan kode baris demi baris.",
  category: "AI",
  path: "/api/ai/code-explain?apikey=&code=",
  async run(req, res) {
    const { apikey, code } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!code) {
      return res.status(400).json({ status: false, error: "Parameter 'code' wajib diisi" });
    }
    try {
      const result = await textGen(code, { model: "qwen-coder", system: "Jelaskan alur kerja kode berikut secara mudah dipahami, baris demi baris, dalam bahasa Indonesia" });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Code Explain Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
