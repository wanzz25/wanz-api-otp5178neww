module.exports = {
  name: "Hitung Umur",
  desc: "Hitung usia detail (tahun, bulan, hari), total hari hidup, dan hitung mundur ke ulang tahun berikutnya. Kirim tgl_lahir=YYYY-MM-DD.",
  category: "Converter",
  path: "/api/converter/hitung-umur?apikey=&tgl_lahir=2000-01-15",
  async run(req, res) {
    const { apikey, tgl_lahir } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (tgl_lahir === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'tgl_lahir' wajib diisi" });
    }
    try {
      const lahir = new Date(tgl_lahir);
      if (Number.isNaN(lahir.getTime())) {
        return res.status(400).json({ status: false, error: "Format 'tgl_lahir' tidak valid, gunakan YYYY-MM-DD" });
      }
      const now = new Date();
      let years = now.getFullYear() - lahir.getFullYear();
      let months = now.getMonth() - lahir.getMonth();
      let days = now.getDate() - lahir.getDate();
      if (days < 0) {
        months -= 1;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += prevMonth;
      }
      if (months < 0) { years -= 1; months += 12; }

      const totalDays = Math.floor((now - lahir) / 86400000);

      let nextBday = new Date(now.getFullYear(), lahir.getMonth(), lahir.getDate());
      if (nextBday < now) nextBday = new Date(now.getFullYear() + 1, lahir.getMonth(), lahir.getDate());
      const daysToNext = Math.ceil((nextBday - now) / 86400000);

      return res.status(200).json({
        status: true,
        result: { tahun: years, bulan: months, hari: days, totalHariHidup: totalDays, hariMenujuUlangTahun: daysToNext }
      });
    } catch (error) {
      console.error("Hitung Umur Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
