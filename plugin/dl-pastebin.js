const axios = require("axios");

module.exports = {
  name: "Pastebin Raw",
  desc: "Ambil isi teks mentah dari sebuah link Pastebin.",
  category: "Downloader",
  path: "/api/dl/pastebin?apikey=&url=https://pastebin.com/XXXXXX",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const m = String(url).match(/pastebin\.com\/(?:raw\/)?([a-zA-Z0-9]+)/);
      if (!m) {
        return res.status(400).json({ status: false, error: "URL Pastebin tidak valid" });
      }
      const rawUrl = `https://pastebin.com/raw/${m[1]}`;
      const response = await axios.get(rawUrl, { timeout: 15000, responseType: "text" });
      return res.status(200).json({ status: true, result: String(response.data).slice(0, 20000) });
    } catch (error) {
      console.error("Pastebin Raw Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
