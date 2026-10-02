const AKTIVITAS_FAKTOR = {
  sangat_ringan: 1.2, ringan: 1.375, sedang: 1.55, berat: 1.725, sangat_berat: 1.9
};

module.exports = {
  name: "Kebutuhan Kalori Harian",
  desc: "Hitung BMR (Mifflin-St Jeor) dan TDEE harian. Parameter: gender, berat(kg), tinggi(cm), usia, aktivitas(sangat_ringan|ringan|sedang|berat|sangat_berat).",
  category: "Converter",
  path: "/api/converter/kalori-harian?apikey=&gender=pria&berat=65&tinggi=170&usia=25&aktivitas=sedang",
  async run(req, res) {
    const { apikey, gender, berat, tinggi, usia, aktivitas } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (gender === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'gender' wajib diisi" });
    }
    if (berat === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'berat' wajib diisi" });
    }
    if (tinggi === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'tinggi' wajib diisi" });
    }
    if (usia === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'usia' wajib diisi" });
    }
    try {
      const b = parseFloat(berat), t = parseFloat(tinggi), u = parseFloat(usia);
      if ([b, t, u].some((x) => Number.isNaN(x) || x <= 0)) {
        return res.status(400).json({ status: false, error: "'berat', 'tinggi', dan 'usia' harus angka positif" });
      }
      const g = String(gender).toLowerCase();
      if (!["pria", "wanita"].includes(g)) {
        return res.status(400).json({ status: false, error: "'gender' harus 'pria' atau 'wanita'" });
      }
      const bmr = g === "pria" ? 10 * b + 6.25 * t - 5 * u + 5 : 10 * b + 6.25 * t - 5 * u - 161;
      const faktor = AKTIVITAS_FAKTOR[String(aktivitas || "sedang").toLowerCase()] || AKTIVITAS_FAKTOR.sedang;
      const tdee = bmr * faktor;
      return res.status(200).json({
        status: true,
        result: { bmr: Math.round(bmr), tdee: Math.round(tdee), aktivitas: aktivitas || "sedang" }
      });
    } catch (error) {
      console.error("Kebutuhan Kalori Harian Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
