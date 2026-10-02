module.exports = {
  name: "Word & Char Counter",
  desc: "Hitung jumlah kata, karakter, dan kalimat dari sebuah teks.",
  category: "Text",
  path: "/api/tools/wordcount?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const text = String(q.text);
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const characters = text.length;
      const charactersNoSpace = text.replace(/\s/g, "").length;
      const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length || (text.trim() ? 1 : 0);
      return res.status(200).json({ status: true, result: { words, characters, charactersNoSpace, sentences } });
    } catch (error) {
      console.error("Word & Char Counter Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
