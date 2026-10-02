const axios = require("axios");

module.exports = {
  name: "Daftar Kelurahan/Desa",
  desc: "Daftar Kelurahan/Desa dalam sebuah kecamatan. Kirim id_kec (kode kecamatan).",
  category: "Info",
  path: "/api/info/kelurahan?apikey=&id_kec=3273010",
  async run(req, res) {
    const { apikey, id_kec } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!id_kec) {
      return res.status(400).json({ status: false, error: "Parameter 'id_kec' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id_kec}.json`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Daftar Kelurahan/Desa Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
