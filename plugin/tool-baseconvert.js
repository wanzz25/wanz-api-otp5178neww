module.exports = {
  name: "Number Base Converter",
  desc: "Konversi angka antar basis (2-36). Kirim number, from (basis asal), to (basis tujuan).",
  category: "Encoding",
  path: "/api/tools/baseconvert?apikey=&number=255&from=10&to=16",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.number) {
      return res.status(400).json({ status: false, error: "Parameter 'number' wajib diisi" });
    }
    if (!q.from) {
      return res.status(400).json({ status: false, error: "Parameter 'from' wajib diisi" });
    }
    if (!q.to) {
      return res.status(400).json({ status: false, error: "Parameter 'to' wajib diisi" });
    }
    try {
      const from = parseInt(q.from, 10);
      const to = parseInt(q.to, 10);
      if (from < 2 || from > 36 || to < 2 || to > 36) {
        return res.status(400).json({ status: false, error: "Basis harus antara 2 dan 36" });
      }
      const decimal = parseInt(String(q.number), from);
      if (Number.isNaN(decimal)) {
        return res.status(400).json({ status: false, error: "Angka tidak valid untuk basis asal yang diberikan" });
      }
      const result = decimal.toString(to);
      return res.status(200).json({ status: true, from, to, input: q.number, result });
    } catch (error) {
      console.error("Number Base Converter Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
