module.exports = {
  name: "JSON Minify",
  desc: "Padatkan (minify) teks JSON, hilangkan spasi/indentasi.",
  category: "Text",
  path: "/api/tools/jsonminify?apikey=&json=",
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
      const result = JSON.stringify(parsed);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("JSON Minify Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
