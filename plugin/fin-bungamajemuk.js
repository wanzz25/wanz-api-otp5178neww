module.exports = {
  name: "Kalkulator Bunga Majemuk",
  desc: "Hitung nilai akhir investasi dengan bunga majemuk tahunan. Parameter: modal, bunga_tahunan (persen), tahun.",
  category: "Finance",
  path: "/api/finance/kalkulator-bunga-majemuk?apikey=&modal=10000000&bunga_tahunan=10&tahun=5",
  async run(req, res) {
    const { apikey, modal, bunga_tahunan, tahun } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (modal === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'modal' wajib diisi" });
    }
    if (bunga_tahunan === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'bunga_tahunan' wajib diisi" });
    }
    if (tahun === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'tahun' wajib diisi" });
    }
    try {
      const P = parseFloat(modal);
      const rate = parseFloat(bunga_tahunan) / 100;
      const years = parseInt(tahun, 10);
      if ([P, rate, years].some((x) => Number.isNaN(x)) || P <= 0 || years <= 0) {
        return res.status(400).json({ status: false, error: "Pastikan semua parameter berupa angka valid dan positif" });
      }
      const tabel = [];
      let nilai = P;
      for (let y = 1; y <= years; y++) {
        nilai *= 1 + rate;
        tabel.push({ tahun: y, nilai: Math.round(nilai) });
      }
      return res.status(200).json({
        status: true,
        result: { modalAwal: P, nilaiAkhir: Math.round(nilai), totalBunga: Math.round(nilai - P), tabelPertumbuhan: tabel }
      });
    } catch (error) {
      console.error("Kalkulator Bunga Majemuk Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
