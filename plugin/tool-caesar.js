module.exports = {
  name: "Caesar Cipher",
  desc: "Enkripsi/dekripsi teks dengan Caesar cipher, geser huruf sejumlah 'shift' (bisa negatif untuk dekripsi).",
  category: "Encoding",
  path: "/api/tools/caesar?apikey=&text=&shift=3",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const shift = ((parseInt(q.shift, 10) || 0) % 26 + 26) % 26;
      const result = String(q.text).replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
      });
      return res.status(200).json({ status: true, shift, result });
    } catch (error) {
      console.error("Caesar Cipher Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
