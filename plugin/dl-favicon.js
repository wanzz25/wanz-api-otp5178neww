const axios = require("axios");

module.exports = {
  name: "Favicon Grabber",
  desc: "Ambil ikon favicon resolusi tinggi dari domain mana pun. Kirim domain=google.com.",
  category: "Tools",
  path: "/api/tools/favicon?apikey=&domain=google.com",
  async run(req, res) {
    const { apikey, domain } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!domain) {
      return res.status(400).json({ status: false, error: "Parameter 'domain' wajib diisi" });
    }

    try {
      const clean = String(domain).replace(/^https?:\/\//, "").split("/")[0];
      const response = await axios.get("https://www.google.com/s2/favicons", {
        params: { domain: clean, sz: 256 },
        responseType: "arraybuffer",
        timeout: 15000
      });
      const buffer = Buffer.from(response.data);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Favicon Grabber Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil favicon: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
