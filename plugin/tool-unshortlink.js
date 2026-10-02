const axios = require("axios");

module.exports = {
  name: "Bongkar Shortlink",
  desc: "Lacak URL tujuan akhir dari sebuah shortlink (anti phishing-check sederhana).",
  category: "Tools",
  path: "/api/tools/unshortlink?apikey=&url=https://bit.ly/xxxx",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const response = await axios.get(url, { timeout: 15000, maxRedirects: 10 });
      const finalUrl = response.request?.res?.responseUrl || response.request?.responseURL || url;
      return res.status(200).json({ status: true, result: { original: url, finalUrl } });
    } catch (error) {
      console.error("Bongkar Shortlink Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
