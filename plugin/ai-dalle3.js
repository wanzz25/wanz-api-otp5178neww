const { imageGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Image DALL-E Style",
  desc: "Buat gambar AI foto-realistis kualitas tinggi dari prompt, gaya DALL-E 3.",
  category: "AI",
  path: "/api/ai/dalle3?apikey=&prompt=",
  async run(req, res) {
    const { apikey, prompt } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!prompt) {
      return res.status(400).json({ status: false, error: "Parameter 'prompt' wajib diisi" });
    }

    try {
      const fullPrompt = prompt + ", masterpiece, ultra detailed, 8k resolution, photorealistic";
      const buffer = await imageGen(fullPrompt, { model: "flux-realism", width: 1024, height: 1024 });
      res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("AI Image DALL-E Style Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
