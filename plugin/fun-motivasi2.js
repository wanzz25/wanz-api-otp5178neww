const MOTIVASI_LIST = [
  "Kamu gak harus cepat, yang penting gak berhenti.",
  "Capek itu tanda kamu lagi berusaha, bukan tanda kamu harus menyerah.",
  "Hari ini berat itu wajar, yang penting besok tetap coba lagi.",
  "Progres kecil tetap progres, jangan remehkan langkah kecilmu hari ini.",
  "Orang hebat bukan yang gak pernah jatuh, tapi yang selalu bangun lagi.",
  "Fokus ke apa yang bisa kamu kontrol, lepaskan yang di luar kendalimu."
];

module.exports = {
  name: "Kata-kata Motivasi",
  desc: "Ambil 1 kalimat motivasi pembangkit semangat kerja dan belajar secara acak.",
  category: "Fun",
  path: "/api/fun/motivasi?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = MOTIVASI_LIST[Math.floor(Math.random() * MOTIVASI_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
