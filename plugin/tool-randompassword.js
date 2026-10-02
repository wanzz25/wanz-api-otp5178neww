const crypto = require("crypto");
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

module.exports = {
  name: "Random Password Generator",
  desc: "Buat password acak. Atur panjang lewat length (default 16, maks 128).",
  category: "Generator",
  path: "/api/tools/randompassword?apikey=&length=16",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const length = Math.min(128, Math.max(4, parseInt(q.length, 10) || 16));
      let result = "";
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) result += CHARS[bytes[i] % CHARS.length];
      return res.status(200).json({ status: true, length, result });
    } catch (error) {
      console.error("Random Password Generator Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
