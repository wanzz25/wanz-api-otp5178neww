const axios = require("axios");

const HEADERS = {
  "content-type": "application/json",
  origin: "https://spotyloader.com",
  referer: "https://spotyloader.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
};

// Sumber: spotyloader.com (job-poll pattern: submit track -> poll status sampai ready)
async function spotifyDownload(urlSpotify, format) {
  const track = await axios.post(
    "https://spotyloader.com/api/spotify/track",
    { url: urlSpotify, format },
    { headers: HEADERS, timeout: 20000 }
  );

  const jobId = track.data?.jobId;
  if (!jobId) throw new Error("Gagal membuat tugas unduh (jobId tidak didapat)");

  const MAX_TRIES = 20;
  const DELAY = 1500;

  for (let i = 0; i < MAX_TRIES; i++) {
    const result = await axios.get(`https://spotyloader.com/api/spotify/track/status/${jobId}`, {
      headers: HEADERS,
      timeout: 15000
    });

    if (result.data?.status === "ready") return result.data.post;
    if (result.data?.status === "error" || result.data?.status === "failed") {
      throw new Error("Spotyloader gagal memproses track ini");
    }
    await new Promise((r) => setTimeout(r, DELAY));
  }

  throw new Error("Timeout menunggu proses unduh selesai, coba lagi");
}

module.exports = {
  name: "Spotify Downloader",
  desc: "Download track Spotify jadi MP3/M4A dari URL track-nya (via Spotyloader). Atur format=mp3|m4a (default mp3).",
  category: "Downloader",
  path: "/api/download/spotify?apikey=&url=&format=mp3",
  async run(req, res) {
    const { apikey, url, format } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    if (!/^https?:\/\/open\.spotify\.com\/track\//i.test(url)) {
      return res.status(400).json({ status: false, error: "URL harus link track Spotify yang valid (open.spotify.com/track/...)" });
    }
    const fmt = format === "m4a" ? "m4a" : "mp3";

    try {
      const data = await spotifyDownload(url, fmt);
      return res.status(200).json({ status: true, result: data });
    } catch (error) {
      console.error("Spotify Downloader Error:", error.message);
      const upstream = error.response?.data;
      return res.status(500).json({
        status: false,
        error: "Gagal download Spotify: " + String(error.message || error).slice(0, 300),
        detail: upstream ? String(typeof upstream === "string" ? upstream : JSON.stringify(upstream)).slice(0, 300) : undefined
      });
    }
  }
};
