const axios = require("axios");

module.exports = {
  name: "GitHub Raw File",
  desc: "Ubah link GitHub blob menjadi raw.githubusercontent dan ambil isi teksnya. Kirim url link blob GitHub.",
  category: "Downloader",
  path: "/api/dl/github-raw?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const rawUrl = String(url).replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
      if (rawUrl === String(url)) {
        return res.status(400).json({ status: false, error: "URL bukan link blob GitHub yang valid" });
      }
      const response = await axios.get(rawUrl, { timeout: 15000, responseType: "text" });
      return res.status(200).json({ status: true, rawUrl, result: String(response.data).slice(0, 20000) });
    } catch (error) {
      console.error("GitHub Raw File Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
