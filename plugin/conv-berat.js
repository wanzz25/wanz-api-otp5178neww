const TO_GRAM = { mg: 0.001, gram: 1, ons: 100, kg: 1000, kuintal: 100000, ton: 1000000, lbs: 453.592, ounce: 28.3495 };

module.exports = {
  name: "Konversi Berat",
  desc: "Konversi satuan berat: mg, gram, ons, kg, kuintal, ton, lbs, ounce.",
  category: "Converter",
  path: "/api/converter/berat?apikey=&val=5&from=kg&to=lbs",
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
      if (!TO_GRAM[f] || !TO_GRAM[t]) {
        return res.status(400).json({ status: false, error: "Satuan harus salah satu dari: " + Object.keys(TO_GRAM).join(", ") });
      }
      const grams = v * TO_GRAM[f];
      const result = grams / TO_GRAM[t];
      return res.status(200).json({ status: true, result: { value: v, from: f, to: t, converted: result } });
    } catch (error) {
      console.error("Konversi Berat Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
