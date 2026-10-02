const { gradientText } = require("./lib/textfx");

module.exports = {
  name: "TextPro Blood",
  desc: "Buat teks efek darah horor (blood/horror text) dengan tetesan di bawah huruf.",
  category: "Image Creator",
  path: "/api/textpro/blood?apikey=&text=",
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
        bgColor: "#0d0000",
        colors: ["#c50000", "#5a0000"],
        angle: "vertical",
        shadowColor: "#8a0303",
        shadowBlur: 14,
        afterDraw: (ctx, m) => {
          ctx.fillStyle = "#8a0303";
          const n = 10;
          for (let i = 0; i < n; i++) {
            const dx = m.cx - m.width / 2 + (m.width / n) * i + (m.width / n) * 0.5;
            const len = 12 + Math.random() * 30;
            ctx.beginPath();
            ctx.moveTo(dx - 3, m.cy + m.fontSize * 0.3);
            ctx.lineTo(dx + 3, m.cy + m.fontSize * 0.3);
            ctx.lineTo(dx, m.cy + m.fontSize * 0.3 + len);
            ctx.closePath();
            ctx.fill();
          }
        }
      });
      const buffer = await canvas.encode("png");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TextPro Blood Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
