module.exports = {
  name: "ROT13",
  desc: "Enkripsi/dekripsi teks dengan cipher ROT13 (simetris).",
  category: "Encoding",
  path: "/api/tools/rot13?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = String(q.text).replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("ROT13 Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
