const axios = require("axios");

module.exports = {
  name: "Daftar Kecamatan",
  desc: "Daftar Kecamatan dalam sebuah kabupaten/kota. Kirim id_kab (kode kabupaten).",
  category: "Info",
  path: "/api/info/kecamatan?apikey=&id_kab=3273",
  async run(req, res) {
    const { apikey, id_kab } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!id_kab) {
      return res.status(400).json({ status: false, error: "Parameter 'id_kab' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id_kab}.json`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Daftar Kecamatan Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
