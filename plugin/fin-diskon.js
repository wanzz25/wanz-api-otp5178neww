module.exports = {
  name: "Kalkulator Diskon",
  desc: "Hitung harga akhir untuk diskon tunggal atau diskon bertingkat. Parameter: harga, diskon (pisahkan dengan spasi untuk diskon bertingkat, contoh: '20 10').",
  category: "Finance",
  path: "/api/finance/kalkulator-diskon?apikey=&harga=250000&diskon=20+10",
  async run(req, res) {
    const { apikey, harga, diskon } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (harga === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'harga' wajib diisi" });
    }
    if (diskon === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'diskon' wajib diisi" });
    }
    try {
      const h = parseFloat(harga);
      if (Number.isNaN(h) || h < 0) {
        return res.status(400).json({ status: false, error: "'harga' harus angka positif" });
      }
      const diskonList = String(diskon).trim().split(/\s+/).map(Number);
      if (diskonList.some((d) => Number.isNaN(d) || d < 0 || d > 100)) {
        return res.status(400).json({ status: false, error: "'diskon' harus berupa angka 0-100, pisahkan spasi untuk bertingkat" });
      }
      let hargaAkhir = h;
      diskonList.forEach((d) => { hargaAkhir -= hargaAkhir * (d / 100); });
      return res.status(200).json({
        status: true,
        result: {
          hargaAwal: h,
          diskon: diskonList,
          hargaAkhir: Math.round(hargaAkhir),
          totalPenghematan: Math.round(h - hargaAkhir)
        }
      });
    } catch (error) {
      console.error("Kalkulator Diskon Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
