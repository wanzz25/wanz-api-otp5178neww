const axios = require("axios");

module.exports = {
  name: "GitHub Gist Raw",
  desc: "Ambil isi mentah GitHub Gist berdasarkan ID gist-nya.",
  category: "Downloader",
  path: "/api/dl/gist-raw?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!id) {
      return res.status(400).json({ status: false, error: "Parameter 'id' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.github.com/gists/${id}`, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const files = Object.values(response.data.files || {}).map((f) => ({
        filename: f.filename,
        language: f.language,
        rawUrl: f.raw_url,
        content: (f.content || "").slice(0, 5000)
      }));
      return res.status(200).json({ status: true, result: files });
    } catch (error) {
      console.error("GitHub Gist Raw Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
