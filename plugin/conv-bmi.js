module.exports = {
  name: "Kalkulator BMI",
  desc: "Hitung Body Mass Index dari berat (kg) dan tinggi (cm), beserta kategorinya.",
  category: "Converter",
  path: "/api/converter/kalkulator-bmi?apikey=&berat=65&tinggi=170",
  async run(req, res) {
    const { apikey, berat, tinggi } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (berat === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'berat' wajib diisi" });
    }
    if (tinggi === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'tinggi' wajib diisi" });
    }
    try {
      const b = parseFloat(berat), t = parseFloat(tinggi) / 100;
      if (Number.isNaN(b) || Number.isNaN(t) || b <= 0 || t <= 0) {
        return res.status(400).json({ status: false, error: "'berat' dan 'tinggi' harus angka positif" });
      }
      const bmi = b / (t * t);
      let kategori;
      if (bmi < 18.5) kategori = "Kurus";
      else if (bmi < 25) kategori = "Ideal";
      else if (bmi < 30) kategori = "Gemuk";
      else kategori = "Obesitas";
      const idealMin = Math.round(18.5 * t * t * 10) / 10;
      const idealMax = Math.round(24.9 * t * t * 10) / 10;
      return res.status(200).json({
        status: true,
        result: { bmi: Math.round(bmi * 10) / 10, kategori, beratIdealMin: idealMin, beratIdealMax: idealMax }
      });
    } catch (error) {
      console.error("Kalkulator BMI Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
