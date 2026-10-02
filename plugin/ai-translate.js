const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Translate",
  desc: "Terjemahkan teks secara kontekstual ke bahasa tujuan (parameter to, contoh: Inggris, Jepang).",
  category: "AI",
  path: "/api/ai/translate-ai?apikey=&text=&to=Inggris",
  async run(req, res) {
    const { apikey, text, to } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    if (!to) {
      return res.status(400).json({ status: false, error: "Parameter 'to' (bahasa tujuan) wajib diisi" });
    }
    try {
      const result = await textGen(text, { model: "openai", system: `Terjemahkan teks berikut ke bahasa ${to} secara kontekstual dan natural. Jika bahasa tujuan punya aksara/pelafalan berbeda, sertakan cara baca (romaji/transliterasi).` });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Translate Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
