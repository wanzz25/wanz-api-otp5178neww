const BUCIN_LIST = [
  "Kamu itu alasan kenapa aku masih semangat buka HP tiap pagi.",
  "Jarak jauh gapapa, yang penting hati gak kemana-mana.",
  "Aku gapapa capek kerja, asal nanti bisa cerita ke kamu.",
  "Kamu bukan alasan aku bahagia, tapi kamu bikin bahagia itu lebih berarti.",
  "Semua lagu galau jadi masuk akal pas inget kamu lagi jauh.",
  "Rasanya pengen cepet-cepet pulang biar bisa video call sama kamu."
];

module.exports = {
  name: "Kata-kata Bucin",
  desc: "Ambil 1 kutipan kata-kata bucin (budak cinta) romantis secara acak.",
  category: "Fun",
  path: "/api/fun/bucin?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = BUCIN_LIST[Math.floor(Math.random() * BUCIN_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
