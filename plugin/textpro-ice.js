const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Ice",
  desc: "Buat teks efek es beku (ice/frozen text).",
  category: "Image Creator",
  path: "/api/textpro/ice?apikey=&text=",
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
        bgColor: "#031421",
        colors: ["#e0f7fa", "#80deea", "#0288d1"],
        angle: "vertical",
        shadowColor: "#00e5ff",
        shadowBlur: 22,
        strokeColor: "#ffffff",
        strokeWidth: 2
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Ice Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
