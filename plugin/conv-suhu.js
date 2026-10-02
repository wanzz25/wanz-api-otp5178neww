module.exports = {
  name: "Konversi Suhu",
  desc: "Konversi suhu antar Celcius (C), Fahrenheit (F), Kelvin (K), dan Reamur (R).",
  category: "Converter",
  path: "/api/converter/suhu?apikey=&val=100&from=C&to=F",
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
      const units = ["C", "F", "K", "R"];
      const f = String(dari).toUpperCase(), t = String(tujuan).toUpperCase();
      if (!units.includes(f) || !units.includes(t)) {
        return res.status(400).json({ status: false, error: "Satuan harus salah satu dari: C, F, K, R" });
      }
      let celsius;
      if (f === "C") celsius = v;
      else if (f === "F") celsius = (v - 32) * (5 / 9);
      else if (f === "K") celsius = v - 273.15;
      else celsius = v * (5 / 4);

      let result;
      if (t === "C") result = celsius;
      else if (t === "F") result = celsius * (9 / 5) + 32;
      else if (t === "K") result = celsius + 273.15;
      else result = celsius * (4 / 5);

      return res.status(200).json({ status: true, result: { value: v, from: f, to: t, converted: Math.round(result * 100) / 100 } });
    } catch (error) {
      console.error("Konversi Suhu Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
