const TO_METER = { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, feet: 0.3048, yard: 0.9144, mile: 1609.344 };

module.exports = {
  name: "Konversi Panjang",
  desc: "Konversi satuan panjang: mm, cm, m, km, inch, feet, yard, mile.",
  category: "Converter",
  path: "/api/converter/panjang?apikey=&val=10&from=km&to=mile",
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
      if (!TO_METER[f] || !TO_METER[t]) {
        return res.status(400).json({ status: false, error: "Satuan harus salah satu dari: " + Object.keys(TO_METER).join(", ") });
      }
      const meters = v * TO_METER[f];
      const result = meters / TO_METER[t];
      return res.status(200).json({ status: true, result: { value: v, from: f, to: t, converted: result } });
    } catch (error) {
      console.error("Konversi Panjang Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
