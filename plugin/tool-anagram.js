module.exports = {
  name: "Cek Anagram",
  desc: "Cek apakah dua kata/teks (a dan b) adalah anagram satu sama lain.",
  category: "Text",
  path: "/api/tools/anagram?apikey=&a=&b=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.a) {
      return res.status(400).json({ status: false, error: "Parameter 'a' wajib diisi" });
    }
    if (!q.b) {
      return res.status(400).json({ status: false, error: "Parameter 'b' wajib diisi" });
    }
    try {
      const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "").split("").sort().join("");
      const isAnagram = norm(q.a) === norm(q.b);
      return res.status(200).json({ status: true, result: { a: q.a, b: q.b, isAnagram } });
    } catch (error) {
      console.error("Cek Anagram Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
