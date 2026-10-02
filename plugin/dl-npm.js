const axios = require("axios");

module.exports = {
  name: "NPM Package Info",
  desc: "Ambil info paket NPM terbaru beserta link unduhan tarball. Kirim pkg=express.",
  category: "Downloader",
  path: "/api/dl/npm-package?apikey=&pkg=express",
  async run(req, res) {
    const { apikey, pkg } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!pkg) {
      return res.status(400).json({ status: false, error: "Parameter 'pkg' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, { timeout: 15000 });
      const d = response.data;
      return res.status(200).json({
        status: true,
        result: {
          name: d.name,
          version: d.version,
          description: d.description,
          license: d.license,
          homepage: d.homepage,
          tarball: d.dist && d.dist.tarball
        }
      });
    } catch (error) {
      console.error("NPM Package Info Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
