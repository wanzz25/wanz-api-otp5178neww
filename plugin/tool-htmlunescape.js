module.exports = {
  name: "HTML Unescape",
  desc: "Kembalikan entity HTML (&amp; dsb) menjadi karakter aslinya.",
  category: "Encoding",
  path: "/api/tools/htmlunescape?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const map = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
      const result = String(q.text).replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => map[m]);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("HTML Unescape Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
