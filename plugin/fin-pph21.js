// PTKP tahunan 2024/2025 (referensi umum, bisa berubah sesuai regulasi terbaru)
const PTKP = {
  "TK/0": 54000000, "TK/1": 58500000, "TK/2": 63000000, "TK/3": 67500000,
  "K/0": 58500000, "K/1": 63000000, "K/2": 67500000, "K/3": 72000000
};

function hitungPajakProgresif(pkp) {
  const bracket = [
    [60000000, 0.05], [250000000, 0.15], [500000000, 0.25], [5000000000, 0.30], [Infinity, 0.35]
  ];
  let sisa = pkp, pajak = 0, batasBawah = 0;
  for (const [batasAtas, tarif] of bracket) {
    if (sisa <= 0) break;
    const lebar = batasAtas - batasBawah;
    const kena = Math.min(sisa, lebar);
    pajak += kena * tarif;
    sisa -= kena;
    batasBawah = batasAtas;
  }
  return pajak;
}

module.exports = {
  name: "Kalkulator PPh 21",
  desc: "Estimasi potongan pajak penghasilan bulanan karyawan (skema sederhana). Parameter: gaji_bulanan, status (TK/0, K/0, K/1, K/2, K/3).",
  category: "Finance",
  path: "/api/finance/kalkulator-pph21?apikey=&gaji_bulanan=10000000&status=TK/0",
  async run(req, res) {
    const { apikey, gaji_bulanan, status } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (gaji_bulanan === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'gaji_bulanan' wajib diisi" });
    }
    if (status === undefined) {
      return res.status(400).json({ status: false, error: "Parameter 'status' wajib diisi" });
    }
    try {
      const gaji = parseFloat(gaji_bulanan);
      const stat = String(status).toUpperCase();
      if (Number.isNaN(gaji) || gaji <= 0) {
        return res.status(400).json({ status: false, error: "'gaji_bulanan' harus angka positif" });
      }
      if (!PTKP[stat]) {
        return res.status(400).json({ status: false, error: "'status' harus salah satu dari: " + Object.keys(PTKP).join(", ") });
      }
      const gajiTahunan = gaji * 12;
      const biayaJabatan = Math.min(gajiTahunan * 0.05, 6000000);
      const pkp = Math.max(0, gajiTahunan - biayaJabatan - PTKP[stat]);
      const pajakTahunan = hitungPajakProgresif(pkp);
      const pajakBulanan = pajakTahunan / 12;
      return res.status(200).json({
        status: true,
        result: {
          gajiBulanan: gaji,
          ptkpTahunan: PTKP[stat],
          penghasilanKenaPajakTahunan: Math.round(pkp),
          estimasiPajakTahunan: Math.round(pajakTahunan),
          estimasiPotonganBulanan: Math.round(pajakBulanan),
          catatan: "Estimasi skema umum, bukan perhitungan resmi DJP. Konsultasikan ke konsultan pajak untuk kepastian."
        }
      });
    } catch (error) {
      console.error("Kalkulator PPh 21 Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
