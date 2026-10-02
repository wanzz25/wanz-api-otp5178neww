module.exports = {
  name: "Timestamp Converter",
  desc: "Konversi Unix timestamp (detik) ke tanggal ISO, atau sebaliknya jika kirim date bukan timestamp.",
  category: "Text",
  path: "/api/tools/timestamp?apikey=&timestamp=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      if (q.timestamp) {
        const ts = parseInt(q.timestamp, 10);
        if (Number.isNaN(ts)) {
          return res.status(400).json({ status: false, error: "Parameter 'timestamp' harus berupa angka (detik)" });
        }
        const date = new Date(ts * 1000);
        return res.status(200).json({ status: true, result: { timestamp: ts, iso: date.toISOString(), utc: date.toUTCString() } });
      }
      if (q.date) {
        const date = new Date(q.date);
        if (Number.isNaN(date.getTime())) {
          return res.status(400).json({ status: false, error: "Parameter 'date' tidak bisa diparse" });
        }
        return res.status(200).json({ status: true, result: { date: q.date, timestamp: Math.floor(date.getTime() / 1000), iso: date.toISOString() } });
      }
      const now = new Date();
      return res.status(200).json({ status: true, result: { timestamp: Math.floor(now.getTime() / 1000), iso: now.toISOString() } });
    } catch (error) {
      console.error("Timestamp Converter Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
