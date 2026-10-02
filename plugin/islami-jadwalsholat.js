const axios = require("axios");

module.exports = {
  name: "Jadwal Sholat Kota",
  desc: "Jadwal sholat hari ini (Imsak s.d. Isya) untuk sebuah kota di Indonesia.",
  category: "Info",
  path: "/api/islami/jadwal-sholat?apikey=&kota=jakarta",
  async run(req, res) {
    const { apikey, kota } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!kota) {
      return res.status(400).json({ status: false, error: "Parameter 'kota' wajib diisi" });
    }
    try {
      const cari = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(kota)}`, { timeout: 15000 });
      const kotaData = cari.data.data && cari.data.data[0];
      if (!kotaData) return res.status(404).json({ status: false, error: "Kota tidak ditemukan" });
      const today = new Date();
      const tgl = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const jadwal = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${kotaData.id}/${tgl}`, { timeout: 15000 });
      return res.status(200).json({ status: true, result: { kota: kotaData.lokasi, jadwal: jadwal.data.data.jadwal } });
    } catch (error) {
      console.error("Jadwal Sholat Kota Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
