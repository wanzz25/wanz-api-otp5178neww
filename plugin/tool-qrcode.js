const QRCode = require("qrcode");

module.exports = {
  name: "QR Code Generator",
  desc: "Buat gambar QR code (PNG) dari teks atau URL apa pun. Atur ukuran lewat size (default 512px).",
  category: "Generator",
  path: "/api/tools/qrcode?apikey=&text=&size=512",
  async run(req, res) {
    const { apikey, text, size } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    const width = Math.min(2048, Math.max(64, parseInt(size, 10) || 512));

    try {
      const buffer = await QRCode.toBuffer(String(text), {
        type: "png",
        width,
        margin: 2,
        errorCorrectionLevel: "M"
      });

      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("QR Code Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat QR code: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
