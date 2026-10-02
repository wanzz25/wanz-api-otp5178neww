const axios = require("axios");

module.exports = {
  name: "Shortlink TinyURL",
  desc: "Perpendek URL panjang pakai TinyURL.",
  category: "Tools",
  path: "/api/tools/shortlink-tinyurl?apikey=&url=https://google.com",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const response = await axios.get("https://tinyurl.com/api-create.php", { params: { url }, timeout: 15000, responseType: "text" });
      return res.status(200).json({ status: true, result: response.data });
    } catch (error) {
      console.error("Shortlink TinyURL Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
