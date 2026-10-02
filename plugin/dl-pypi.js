const axios = require("axios");

module.exports = {
  name: "PyPI Package Info",
  desc: "Ambil metadata library Python terbaru dari PyPI. Kirim pkg=requests.",
  category: "Downloader",
  path: "/api/dl/pypi-package?apikey=&pkg=requests",
  async run(req, res) {
    const { apikey, pkg } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!pkg) {
      return res.status(400).json({ status: false, error: "Parameter 'pkg' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`, { timeout: 15000 });
      const info = response.data.info;
      const urls = (response.data.urls || []).map((u) => ({ filename: u.filename, url: u.url, packagetype: u.packagetype }));
      return res.status(200).json({
        status: true,
        result: { name: info.name, version: info.version, summary: info.summary, license: info.license, homepage: info.home_page, files: urls }
      });
    } catch (error) {
      console.error("PyPI Package Info Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
