const axios = require("axios");

module.exports = {
  name: "Google Drive Direct Link",
  desc: "Buat direct download link dari URL Google Drive biasa.",
  category: "Downloader",
  path: "/api/dl/gdrive?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const m = String(url).match(/[-\w]{25,}/);
      if (!m) {
        return res.status(400).json({ status: false, error: "File ID Google Drive tidak ditemukan pada URL" });
      }
      const fileId = m[0];
      const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
      return res.status(200).json({ status: true, result: { fileId, directUrl } });
    } catch (error) {
      console.error("Google Drive Direct Link Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
