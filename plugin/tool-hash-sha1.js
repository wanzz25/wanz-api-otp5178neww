const crypto = require("crypto");

module.exports = {
  name: "Hash SHA-1",
  desc: "Hitung hash SHA-1 dari sebuah teks.",
  category: "Encoding",
  path: "/api/tools/hash-sha1?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = crypto.createHash("sha1").update(String(q.text), "utf8").digest("hex");
      return res.status(200).json({ status: true, algo: "sha1", result });
    } catch (error) {
      console.error("Hash SHA-1 Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
