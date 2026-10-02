const { imageGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Logo Generator",
  desc: "Buat logo minimalis dari deskripsi (nama brand/tema) menggunakan AI.",
  category: "AI",
  path: "/api/ai/logo-generator?apikey=&prompt=",
  async run(req, res) {
    const { apikey, prompt } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!prompt) {
      return res.status(400).json({ status: false, error: "Parameter 'prompt' wajib diisi" });
    }

    try {
      const fullPrompt = prompt + ", minimalist flat vector logo design, clean white background, professional branding, symmetrical";
      const buffer = await imageGen(fullPrompt, { model: "flux", width: 1024, height: 1024 });
      res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("AI Logo Generator Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
