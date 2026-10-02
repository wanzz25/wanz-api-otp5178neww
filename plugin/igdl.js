const axios = require("axios");

// Sumber: instaloadr.com (reel/video/foto Instagram)
async function igDownloader(link) {
  const response = await axios.post(
    "https://www.instaloadr.com/api/fetch",
    { url: link, media_type: "post" },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        referer: "https://www.instaloadr.com/",
        origin: "https://www.instaloadr.com"
      },
      timeout: 20000
    }
  );
  return response.data;
}

module.exports = {
  name: "Instagram Downloader",
  desc: "Download reels, video, atau foto Instagram dari URL post/reel-nya (via Instaloadr).",
  category: "Downloader",
  path: "/api/download/igdl?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(url)) {
      return res.status(400).json({ status: false, error: "URL harus link Instagram yang valid" });
    }

    try {
      const data = await igDownloader(url);
      return res.status(200).json({ status: true, result: data });
    } catch (error) {
      console.error("IG Downloader Error:", error.message);
      const upstream = error.response?.data;
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data Instagram: " + String(error.message || error).slice(0, 300),
        detail: upstream ? String(typeof upstream === "string" ? upstream : JSON.stringify(upstream)).slice(0, 300) : undefined
      });
    }
  }
};
