const { textGen } = require("./lib/pollinations");

module.exports = {
  name: "AI Code Converter",
  desc: "Terjemahkan kode dari satu bahasa pemrograman ke bahasa lain. Parameter: code, from, to.",
  category: "AI",
  path: "/api/ai/code-convert?apikey=&code=&from=python&to=javascript",
  async run(req, res) {
    const { apikey, code, from: bahasaAsal, to: bahasaTujuan } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!code) {
      return res.status(400).json({ status: false, error: "Parameter 'code' wajib diisi" });
    }
    if (!bahasaAsal || !bahasaTujuan) {
      return res.status(400).json({ status: false, error: "Parameter 'from' dan 'to' wajib diisi" });
    }
    try {
      const result = await textGen(code, { model: "qwen-coder", system: `Terjemahkan kode berikut dari bahasa ${bahasaAsal} ke ${bahasaTujuan} secara akurat. Kembalikan hasil kode lengkap.` });
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AI Code Converter Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses AI: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
