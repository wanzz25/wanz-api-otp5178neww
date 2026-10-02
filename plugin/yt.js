const axios = require("axios");
const { downloadAudioWithFallback } = require("./lib/yt-providers");

const API = "https://content-service.opa-shan.workers.dev";
const POLL_DELAY = 1500;
const POLL_MAX_TRIES = 14; // ~21 detik, sebelumnya ~56 detik

const ytHeaders = {
  "sec-ch-ua-platform": "\"Windows\"",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  "sec-ch-ua": "\"Chromium\";v=\"152\", \"Not?A_Brand\";v=\"24\", \"Google Chrome\";v=\"152\"",
  "content-type": "application/json",
  "sec-ch-ua-mobile": "?0",
  "accept": "*/*",
  "origin": "https://www.y2mate.rest",
  "sec-fetch-site": "cross-site",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  "referer": "https://www.y2mate.rest/",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "priority": "u=1, i"
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripInternal(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = { ...obj };
  delete clone.status_url;
  delete clone.created_at;
  delete clone.updated_at;
  delete clone.expires_at;
  return clone;
}

async function downloadYt(url, format = "mp4") {
  const input = { url, format };
  const requestInput = { ...input, format: format === "mp4" ? "720" : "mp3" };

  const post = await axios.post(`${API}/api/v1/downloads`, requestInput, {
    headers: ytHeaders,
    timeout: 15000,
    validateStatus: () => true
  });

  const postData = post.data;

  if (!postData?.job_id) {
    return {
      status: postData?.status || "failed",
      code: post.status,
      input,
      result: stripInternal(postData)
    };
  }

  for (let i = 0; i < POLL_MAX_TRIES; i++) {
    await sleep(POLL_DELAY);

    const get = await axios.get(`${API}/api/v1/downloads/${postData.job_id}`, {
      headers: ytHeaders,
      timeout: 10000,
      validateStatus: () => true
    });

    const result = get.data;

    if (result.status === "ready" || result.status === "failed" || result.status === "error") {
      return {
        status: result.status,
        code: get.status,
        input,
        result: stripInternal(result)
      };
    }
  }

  return {
    status: "timeout",
    code: 504,
    input,
    result: { message: "Job belum selesai dalam batas waktu polling" }
  };
}

module.exports = {
  name: "Youtube Downloader (MP3/MP4)",
  desc: "Download Youtube ke MP3 atau MP4 dalam satu endpoint, tinggal ganti parameter format.",
  category: "Downloader",
  path: "/api/download/yt?apikey=&url=&format=",
  async run(req, res) {
    const { url, apikey, format } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    const allowedFormat = ["mp3", "mp4"];
    const fmt = allowedFormat.includes((format || "").toLowerCase()) ? format.toLowerCase() : "mp4";

    try {
      const data = await downloadYt(url, fmt);
      if (data.status === "ready") {
        return res.status(200).json({ status: true, data });
      }

      // fallback: kalau format mp3 dan provider utama gagal, coba provider lain
      if (fmt === "mp3") {
        try {
          const fallback = await downloadAudioWithFallback(url);
          return res.status(200).json({
            status: true,
            data: { status: "ready", input: { url, format: "mp3" }, result: fallback }
          });
        } catch (fallbackErr) {
          return res.status(400).json({ status: false, data, fallback_error: fallbackErr.message });
        }
      }

      return res.status(400).json({ status: false, data });
    } catch (error) {
      if (fmt === "mp3") {
        try {
          const fallback = await downloadAudioWithFallback(url);
          return res.status(200).json({
            status: true,
            data: { status: "ready", input: { url, format: "mp3" }, result: fallback }
          });
        } catch (fallbackErr) {
          return res.status(500).json({ status: false, error: error.message || error, fallback_error: fallbackErr.message });
        }
      }
      return res.status(500).json({ status: false, error: error.message || error });
    }
  }
};
