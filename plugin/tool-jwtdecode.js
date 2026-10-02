module.exports = {
  name: "JWT Decode",
  desc: "Decode header & payload JWT tanpa verifikasi signature (untuk debugging).",
  category: "Encoding",
  path: "/api/tools/jwtdecode?apikey=&token=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.token) {
      return res.status(400).json({ status: false, error: "Parameter 'token' wajib diisi" });
    }
    try {
      const parts = String(q.token).split(".");
      if (parts.length < 2) {
        return res.status(400).json({ status: false, error: "Format token JWT tidak valid" });
      }
      const decodePart = (p) => JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
      const header = decodePart(parts[0]);
      const payload = decodePart(parts[1]);
      return res.status(200).json({ status: true, result: { header, payload } });
    } catch (error) {
      console.error("JWT Decode Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
