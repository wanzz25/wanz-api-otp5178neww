module.exports = {
  name: "Kalkulator KPR",
  desc: "Hitung cicilan bulanan tetap (anuitas) KPR/kredit. Parameter: harga, dp (uang muka), bunga (persen/tahun), tenor_tahun.",
  category: "Finance",
  path: "/api/finance/kalkulator-kpr?apikey=&harga=500000000&dp=50000000&bunga=8&tenor_tahun=15",
  async run(req, res) {
    const { apikey, harga, dp, bunga, tenor_tahun } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (harga === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'harga' wajib diisi" });
    }
    if (dp === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'dp' wajib diisi" });
    }
    if (bunga === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'bunga' wajib diisi" });
    }
    if (tenor_tahun === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'tenor_tahun' wajib diisi" });
    }
    try {
      const P = parseFloat(harga) - parseFloat(dp);
      const annualRate = parseFloat(bunga) / 100;
      const months = parseFloat(tenor_tahun) * 12;
      if ([P, annualRate, months].some((x) => Number.isNaN(x)) || P <= 0 || months <= 0) {
        return res.status(400).json({ status: false, error: "Pastikan semua parameter berupa angka valid dan pinjaman pokok positif" });
      }
      const r = annualRate / 12;
      const cicilan = r === 0 ? P / months : (P * r) / (1 - Math.pow(1 + r, -months));
      const totalBayar = cicilan * months;
      const totalBunga = totalBayar - P;
      return res.status(200).json({
        status: true,
        result: {
          pokokPinjaman: Math.round(P),
          cicilanPerBulan: Math.round(cicilan),
          totalBunga: Math.round(totalBunga),
          totalBayar: Math.round(totalBayar)
        }
      });
    } catch (error) {
      console.error("Kalkulator KPR Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
