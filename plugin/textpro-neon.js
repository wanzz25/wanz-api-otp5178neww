const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Neon",
  desc: "Buat teks efek neon menyala cyan di latar gelap.",
  category: "Image Creator",
  path: "/api/textpro/neon?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const { canvas } = gradientText(String(text).toUpperCase().slice(0, 40), {
        bgColor: "#050508",
        colors: ["#00ffff", "#ffffff", "#00ffff"],
        shadowColor: "#00ffff",
        shadowBlur: 35
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Neon Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
