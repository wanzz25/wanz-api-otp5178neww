const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Blackpink Style",
  desc: "Buat teks bergaya Blackpink: pink terang dengan bingkai kotak.",
  category: "Image Creator",
  path: "/api/textpro/blackpink?apikey=&text=",
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
        colors: ["#ff69b4", "#ff1493"],
        shadowColor: "#ff1493",
        shadowBlur: 16,
        afterDraw: (ctx) => {
          ctx.strokeStyle = "#ff69b4";
          ctx.lineWidth = 6;
          ctx.strokeRect(40, 40, 820, 340);
        }
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Blackpink Style Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
