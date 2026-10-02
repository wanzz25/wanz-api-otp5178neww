const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Silver",
  desc: "Buat teks efek perak metalik/krom (silver/chrome text).",
  category: "Image Creator",
  path: "/api/textpro/silver?apikey=&text=",
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
        bgColor: "#1c1c1c",
        colors: ["#757575", "#E8E8E8", "#424242", "#FFFFFF", "#9E9E9E"],
        shadowColor: "#000000",
        shadowBlur: 10,
        strokeColor: "#2a2a2a",
        strokeWidth: 2
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Silver Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
