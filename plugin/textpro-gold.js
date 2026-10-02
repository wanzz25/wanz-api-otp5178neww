const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Gold",
  desc: "Buat teks efek emas mengilap (gold text).",
  category: "Image Creator",
  path: "/api/textpro/gold?apikey=&text=",
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
        bgColor: "#1a1409",
        colors: ["#BF953F", "#FCF6BA", "#B38728", "#FBF5B7", "#AA771C"],
        shadowColor: "#7a5a10",
        shadowBlur: 18,
        strokeColor: "#3a2a05",
        strokeWidth: 2
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Gold Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
