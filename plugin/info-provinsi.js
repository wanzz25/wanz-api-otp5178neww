const axios = require("axios");

module.exports = {
  name: "Daftar Provinsi Indonesia",
  desc: "Seluruh daftar Provinsi di Indonesia beserta kode wilayah.",
  category: "Info",
  path: "/api/info/provinsi?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Daftar Provinsi Indonesia Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
