const axios = require("axios");

module.exports = {
  name: "GitHub Latest Release",
  desc: "Ambil daftar file rilis terbaru (installer/binary) dari sebuah repo GitHub.",
  category: "Downloader",
  path: "/api/dl/github-release?apikey=&owner=nodejs&repo=node",
  async run(req, res) {
    const { apikey, owner, repo } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!owner || !repo) {
      return res.status(400).json({ status: false, error: "Parameter 'owner' dan 'repo' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const d = response.data;
      return res.status(200).json({
        status: true,
        result: {
          tag: d.tag_name,
          name: d.name,
          notes: d.body,
          assets: (d.assets || []).map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url }))
        }
      });
    } catch (error) {
      console.error("GitHub Latest Release Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
