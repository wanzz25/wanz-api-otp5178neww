module.exports = {
  name: "Binary Encode",
  desc: "Ubah teks menjadi deret angka biner (per karakter, 8-bit).",
  category: "Encoding",
  path: "/api/tools/binaryencode?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = String(q.text)
        .split("")
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
        .join(" ");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Binary Encode Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
