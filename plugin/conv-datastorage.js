const TO_BYTE = { bit: 0.125, byte: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4, pb: 1024 ** 5 };

module.exports = {
  name: "Konversi Data Storage",
  desc: "Konversi satuan penyimpanan digital: bit, byte, KB, MB, GB, TB, PB.",
  category: "Converter",
  path: "/api/converter/data-storage?apikey=&val=1024&from=MB&to=GB",
  async run(req, res) {
    const { apikey, val, from: dari, to: tujuan } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (val === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'val' wajib diisi" });
    }
    if (dari === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'dari' wajib diisi" });
    }
    if (tujuan === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'tujuan' wajib diisi" });
    }
    try {
      const v = parseFloat(val);
      if (Number.isNaN(v)) return res.status(400).json({ status: false, error: "'val' harus berupa angka" });
      const f = String(dari).toLowerCase(), t = String(tujuan).toLowerCase();
      if (!TO_BYTE[f] || !TO_BYTE[t]) {
        return res.status(400).json({ status: false, error: "Satuan harus salah satu dari: " + Object.keys(TO_BYTE).join(", ") });
      }
      const bytes = v * TO_BYTE[f];
      const result = bytes / TO_BYTE[t];
      return res.status(200).json({ status: true, result: { value: v, from: f, to: t, converted: result } });
    } catch (error) {
      console.error("Konversi Data Storage Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
