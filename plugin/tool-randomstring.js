const crypto = require("crypto");
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

module.exports = {
  name: "Random String Generator",
  desc: "Buat string acak alfanumerik. Atur panjang lewat length (default 12, maks 256).",
  category: "Generator",
  path: "/api/tools/randomstring?apikey=&length=12",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const length = Math.min(256, Math.max(1, parseInt(q.length, 10) || 12));
      let result = "";
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) result += CHARS[bytes[i] % CHARS.length];
      return res.status(200).json({ status: true, length, result });
    } catch (error) {
      console.error("Random String Generator Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
