const TRUTH_LIST = [
  "Apa hal paling memalukan yang pernah kamu lakukan di depan umum?",
  "Siapa orang yang paling kamu kagumi dan kenapa?",
  "Apa rahasia yang belum pernah kamu ceritakan ke siapa pun?",
  "Kapan terakhir kali kamu berbohong, dan apa alasannya?",
  "Apa ketakutan terbesarmu saat ini?",
  "Pernahkah kamu menyesali satu keputusan besar? Apa itu?",
  "Siapa orang yang paling berpengaruh dalam hidupmu?",
  "Apa kebiasaan burukmu yang ingin kamu ubah?"
];

module.exports = {
  name: "Truth (Pertanyaan Jujur)",
  desc: "Ambil 1 pertanyaan jujur (Truth) acak untuk permainan Truth or Dare.",
  category: "Fun",
  path: "/api/fun/truth?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = TRUTH_LIST[Math.floor(Math.random() * TRUTH_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
