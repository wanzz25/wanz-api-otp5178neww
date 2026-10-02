const ADVICE = [
  "Jangan bandingkan babak 1 hidupmu dengan babak 20 hidup orang lain.",
  "Istirahat itu produktif, jangan merasa bersalah untuk beristirahat.",
  "Minta maaf duluan bukan berarti kamu salah, itu berarti kamu menghargai hubungan.",
  "Kesalahan terbesar adalah takut membuat kesalahan.",
  "Fokus pada progres, bukan kesempurnaan.",
  "Jangan menunggu motivasi, mulai saja dan motivasi akan menyusul.",
  "Rawat tubuhmu, itu satu-satunya tempat kamu wajib tinggal.",
  "Belajar mengatakan tidak tanpa merasa bersalah.",
  "Uang yang hilang bisa dicari lagi, waktu yang hilang tidak akan kembali.",
  "Lebih baik terlambat memulai daripada tidak sama sekali."
];

module.exports = {
  name: "Random Advice",
  desc: "Dapatkan satu nasihat singkat acak.",
  category: "Fun",
  path: "/api/fun/advice?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const result = ADVICE[Math.floor(Math.random() * ADVICE.length)];
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Random Advice Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
