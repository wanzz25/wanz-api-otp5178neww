module.exports = {
  name: "Hex Decode",
  desc: "Decode teks hexadecimal kembali ke teks asli.",
  category: "Encoding",
  path: "/api/tools/hexdecode?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      if (!/^[0-9a-fA-F]+$/.test(String(q.text)) || q.text.length % 2 !== 0) {
        return res.status(400).json({ status: false, error: "Teks bukan hex yang valid" });
      }
      const result = Buffer.from(String(q.text), "hex").toString("utf8");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Hex Decode Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
