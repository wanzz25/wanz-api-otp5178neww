const { imageGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Image 3D Render",
  desc: "Buat gambar AI 3D render gaya Pixar/Disney dari prompt.",
  category: "AI",
  path: "/api/ai/3d-render?apikey=&prompt=",
  async run(req, res) {
    const { apikey, prompt } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!prompt) {
      return res.status(400).json({ status: false, error: "Parameter 'prompt' wajib diisi" });
    }

    try {
      const fullPrompt = prompt + ", cute 3d pixar disney style, blender render, smooth lighting";
      const buffer = await imageGen(fullPrompt, { model: "flux-3d", width: 1024, height: 1024 });
      res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("AI Image 3D Render Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat gambar AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
