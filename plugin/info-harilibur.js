const axios = require("axios");

module.exports = {
  name: "Hari Libur Nasional",
  desc: "Daftar tanggal merah libur nasional dan cuti bersama Indonesia untuk tahun tertentu.",
  category: "Info",
  path: "/api/info/hari-libur?apikey=&tahun=2026",
  async run(req, res) {
    const { apikey, tahun } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!tahun) {
      return res.status(400).json({ status: false, error: "Parameter 'tahun' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api-harilibur.vercel.app/api?year=${tahun}`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Hari Libur Nasional Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
