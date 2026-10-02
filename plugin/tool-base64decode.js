module.exports = {
  name: "Base64 Decode",
  desc: "Decode teks Base64 kembali ke teks asli.",
  category: "Encoding",
  path: "/api/tools/base64decode?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = Buffer.from(String(q.text), "base64").toString("utf8");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Base64 Decode Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
