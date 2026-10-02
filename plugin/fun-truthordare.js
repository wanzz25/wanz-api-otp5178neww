const TRUTH = [
  "Apa hal paling memalukan yang pernah kamu lakukan?",
  "Siapa orang yang paling kamu kagumi dan kenapa?",
  "Apa rahasia yang belum pernah kamu ceritakan ke siapa pun?",
  "Kapan terakhir kali kamu berbohong dan kenapa?",
  "Apa ketakutan terbesarmu?"
];
const DARE = [
  "Tiru gaya bicara temanmu selama 1 menit.",
  "Kirim pesan lucu ke kontak teratas di HP-mu.",
  "Nyanyikan satu lagu tanpa henti selama 30 detik.",
  "Tunjukkan foto paling lama di galeri HP-mu.",
  "Lakukan 10 push up sekarang juga."
];

module.exports = {
  name: "Truth or Dare",
  desc: "Dapatkan pertanyaan truth atau tantangan dare acak. Atur type=truth|dare, kosongkan untuk acak.",
  category: "Fun",
  path: "/api/fun/truthordare?apikey=&type=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const type = q.type === "truth" || q.type === "dare" ? q.type : (Math.random() < 0.5 ? "truth" : "dare");
      const list = type === "truth" ? TRUTH : DARE;
      const result = list[Math.floor(Math.random() * list.length)];
      return res.status(200).json({ status: true, type, result });
    } catch (error) {
      console.error("Truth or Dare Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
