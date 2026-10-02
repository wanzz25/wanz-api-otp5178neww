const axios = require("axios");

module.exports = {
  name: "IP Geolocation",
  desc: "Lacak lokasi geografis, ISP, dan status proxy/VPN dari sebuah alamat IP.",
  category: "Tools",
  path: "/api/tools/ip-geolocation?apikey=&ip=8.8.8.8",
  async run(req, res) {
    const { apikey, ip } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!ip) {
      return res.status(400).json({ status: false, error: "Parameter 'ip' wajib diisi" });
    }
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`, { params: { fields: 66846719 }, timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("IP Geolocation Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
