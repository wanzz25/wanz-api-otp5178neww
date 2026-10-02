module.exports = {
  name: "JSON Formatter",
  desc: "Rapikan (pretty-print) dan validasi teks JSON.",
  category: "Text",
  path: "/api/tools/jsonformat?apikey=&json=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.json) {
      return res.status(400).json({ status: false, error: "Parameter 'json' wajib diisi" });
    }
    try {
      const parsed = JSON.parse(String(q.json));
      const result = JSON.stringify(parsed, null, 2);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("JSON Formatter Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
