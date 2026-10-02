const LEET_MAP = { a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", A: "4", E: "3", I: "1", O: "0", S: "5", T: "7" };

module.exports = {
  name: "Leetspeak",
  desc: "Ubah teks menjadi gaya leetspeak (a->4, e->3, i->1, o->0, s->5, t->7).",
  category: "Text",
  path: "/api/tools/leetspeak?apikey=&text=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    try {
      const result = String(q.text).split("").map((c) => LEET_MAP[c] !== undefined ? LEET_MAP[c] : c).join("");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Leetspeak Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
