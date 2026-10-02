const axios = require("axios");
const { downloadAudioWithFallback } = require("./lib/yt-providers");

function extractVideoId(input) {
  try {
    const url = new URL(input);

    if (url.hostname === "youtu.be") {
      return url.pathname.substring(1);
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2];
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2];
    }

    return url.searchParams.get("v");
  } catch (e) {
    if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
      return input;
    }
    return null;
  }
}

async function processMedia(youtubeUrl, fileType = "MP4") {
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new Error("URL/ID video Youtube tidak valid");
  }

  const converterUrl = "https://ac.insvid.com/converter";
  const headers = {
    "host": "ac.insvid.com",
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "origin": "https://ac.insvid.com",
    "referer": `https://ac.insvid.com/widget?url=https://www.youtube.com/watch?v=${videoId}&el=147`,
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0"
  };

  const payload = { id: videoId, fileType };

  const response = await axios.post(converterUrl, payload, { headers, timeout: 15000 });

  if (response.data && response.data.status === "ok" && response.data.link) {
    return {
      videoId,
      fileType,
      downloadUrl: response.data.link
    };
  }

  throw new Error("Gagal mendapatkan link download dari converter");
}

module.exports = {
  name: "Youtube Converter (MP3/MP4)",
  desc: "Convert & download video Youtube ke MP3 atau MP4 lewat insvid.",
  category: "Downloader",
  path: "/api/download/ytconvert?apikey=&url=&type=",
  async run(req, res) {
    const { url, apikey, type } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    const allowedType = ["MP3", "MP4"];
    const fileType = allowedType.includes((type || "").toUpperCase())
      ? type.toUpperCase()
      : "MP4";

    try {
      const result = await processMedia(url, fileType);
      return res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      if (fileType === "MP3") {
        try {
          const fallback = await downloadAudioWithFallback(url);
          return res.status(200).json({ status: true, result: fallback });
        } catch (fallbackErr) {
          return res.status(500).json({ status: false, error: error.message || error, fallback_error: fallbackErr.message });
        }
      }
      return res.status(500).json({
        status: false,
        error: error.message || error
      });
    }
  }
};
