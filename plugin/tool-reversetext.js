module.exports = {
  name: "Reverse Text",
  desc: "Balik urutan karakter dalam teks.",
  category: "Text",
  path: "/api/tools/reversetext?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = String(q.text).split("").reverse().join("");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Reverse Text Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
