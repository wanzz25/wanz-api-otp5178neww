const axios = require("axios");

module.exports = {
  name: "Daftar Kabupaten/Kota",
  desc: "Daftar Kabupaten/Kota dalam sebuah provinsi. Kirim id_prov (kode provinsi).",
  category: "Info",
  path: "/api/info/kabupaten?apikey=&id_prov=32",
  async run(req, res) {
    const { apikey, id_prov } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!id_prov) {
      return res.status(400).json({ status: false, error: "Parameter 'id_prov' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id_prov}.json`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Daftar Kabupaten/Kota Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
