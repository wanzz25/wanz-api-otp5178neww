const axios = require("axios");

module.exports = {
  name: "Twitter/X Downloader",
  desc: "Ambil video/foto dan detail tweet dari URL status Twitter/X.",
  category: "Downloader",
  path: "/api/dl/twitter?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    try {
      const m = String(url).match(/status(?:es)?\/(\d+)/);
      if (!m) {
        return res.status(400).json({ status: false, error: "URL tweet tidak valid" });
      }
      const response = await axios.get(`https://api.vxtwitter.com/Twitter/status/${m[1]}`, { timeout: 20000 });
      const d = response.data;
      return res.status(200).json({
        status: true,
        result: {
          text: d.text,
          likes: d.likes,
          retweets: d.retweets,
          media: (d.media_extended || []).map((x) => ({ type: x.type, url: x.url }))
        }
      });
    } catch (error) {
      console.error("Twitter/X Downloader Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
