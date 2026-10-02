const crypto = require("crypto");

module.exports = {
  name: "HMAC Generator",
  desc: "Hasilkan tanda tangan kriptografi HMAC-SHA256 dan HMAC-SHA512 dari pesan dan secret key.",
  category: "Encoding",
  path: "/api/tools/hmac-generator?apikey=&text=&secret=",
  async run(req, res) {
    const { apikey, text, secret } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text || !secret) {
      return res.status(400).json({ status: false, error: "Parameter 'text' dan 'secret' wajib diisi" });
    }

    try {
      const sha256 = crypto.createHmac("sha256", String(secret)).update(String(text)).digest("hex");
      const sha512 = crypto.createHmac("sha512", String(secret)).update(String(text)).digest("hex");
      return res.status(200).json({ status: true, result: { hmacSha256: sha256, hmacSha512: sha512 } });
    } catch (error) {
      console.error("HMAC Generator Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
