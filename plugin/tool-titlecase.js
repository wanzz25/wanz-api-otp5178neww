module.exports = {
  name: "Title Case",
  desc: "Ubah teks menjadi Title Case (Huruf Awal Tiap Kata Kapital).",
  category: "Text",
  path: "/api/tools/titlecase?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = String(q.text).toLowerCase().replace(/(^|\s)([a-z])/g, (m, sp, c) => sp + c.toUpperCase());
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Title Case Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
