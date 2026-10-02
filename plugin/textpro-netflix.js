const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Netflix Style",
  desc: "Buat teks bergaya logo Netflix, merah tebal dengan bayangan 3D.",
  category: "Image Creator",
  path: "/api/textpro/netflix?apikey=&text=",
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
        bgColor: "#000000",
        colors: ["#E50914", "#b70710"],
        angle: "vertical",
        shadowColor: "#8a0000",
        shadowBlur: 4,
        fontFamily: "Georgia, serif",
        maxFont: 150
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Netflix Style Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
