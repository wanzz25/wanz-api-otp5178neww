const crypto = require("crypto");

module.exports = {
  name: "Generate UUID",
  desc: "Buat UUID v4 acak. Tambahkan count untuk beberapa sekaligus (maks 50).",
  category: "Generator",
  path: "/api/tools/uuid?apikey=&count=1",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const count = Math.min(50, Math.max(1, parseInt(q.count, 10) || 1));
      const result = Array.from({ length: count }, () => crypto.randomUUID());
      return res.status(200).json({ status: true, count, result });
    } catch (error) {
      console.error("Generate UUID Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
