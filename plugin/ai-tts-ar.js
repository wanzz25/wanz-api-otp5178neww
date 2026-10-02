const axios = require("axios");

module.exports = {
  name: "TTS Arabic",
  desc: "Ubah teks menjadi audio suara Bahasa Arab (maks 200 karakter).",
  category: "AI",
  path: "/api/ai/tts-ar?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    if (String(text).length > 200) {
      return res.status(400).json({ status: false, error: "Teks maksimal 200 karakter untuk TTS (batas layanan)" });
    }

    try {
      const response = await axios.get("https://translate.google.com/translate_tts", {
        params: { ie: "UTF-8", q: text, tl: "ar", client: "tw-ob" },
        responseType: "arraybuffer",
        timeout: 20000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const buffer = Buffer.from(response.data);
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("TTS Arabic Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat audio TTS: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
