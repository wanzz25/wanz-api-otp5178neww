const axios = require("axios");

module.exports = {
  name: "MAC Address Lookup",
  desc: "Cari nama vendor/perusahaan pembuat perangkat dari alamat MAC.",
  category: "Tools",
  path: "/api/tools/mac-lookup?apikey=&mac=00:1A:2B:3C:4D:5E",
  async run(req, res) {
    const { apikey, mac } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!mac) {
      return res.status(400).json({ status: false, error: "Parameter 'mac' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.macvendors.com/${encodeURIComponent(mac)}`, { timeout: 15000, responseType: "text" });
      return res.status(200).json({ status: true, result: { mac, vendor: response.data } });
    } catch (error) {
      console.error("MAC Address Lookup Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
