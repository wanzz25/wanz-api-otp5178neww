module.exports = {
  name: "Binary Decode",
  desc: "Ubah deret biner (per 8-bit, dipisah spasi) kembali ke teks.",
  category: "Encoding",
  path: "/api/tools/binarydecode?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const parts = String(q.text).trim().split(/\s+/);
      if (!parts.every((p) => /^[01]{1,8}$/.test(p))) {
        return res.status(400).json({ status: false, error: "Format biner tidak valid (pisahkan tiap 8-bit dengan spasi)" });
      }
      const result = parts.map((p) => String.fromCharCode(parseInt(p, 2))).join("");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Binary Decode Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
