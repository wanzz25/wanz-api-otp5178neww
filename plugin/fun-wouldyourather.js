const WYR = [
  "Punya kemampuan terbang atau membaca pikiran orang lain?",
  "Kaya raya tapi kesepian atau miskin tapi dikelilingi orang tersayang?",
  "Kehilangan semua kenangan masa lalu atau tidak bisa membuat kenangan baru?",
  "Selalu telat 10 menit atau selalu terlalu awal 20 menit?",
  "Bisa berbicara semua bahasa di dunia atau bisa bicara dengan hewan?"
];

module.exports = {
  name: "Would You Rather",
  desc: "Dapatkan satu pertanyaan 'would you rather' acak.",
  category: "Fun",
  path: "/api/fun/wouldyourather?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const result = WYR[Math.floor(Math.random() * WYR.length)];
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Would You Rather Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
