const FAKTA_LIST = [
  "Lebah bisa mengenali wajah manusia meski otaknya sangat kecil.",
  "Gurita punya tiga jantung dan darah berwarna biru.",
  "Madu yang disimpan dengan benar tidak akan pernah basi.",
  "Menara Eiffel bisa bertambah tinggi sekitar 15 cm saat musim panas karena pemuaian logam.",
  "Jantung udang terletak di kepalanya, bukan di badan.",
  "Satu hari di planet Venus lebih lama daripada satu tahun di Venus."
];

module.exports = {
  name: "Fakta Unik",
  desc: "Ambil 1 fakta unik dunia sains, sejarah, atau alam yang jarang diketahui orang.",
  category: "Fun",
  path: "/api/fun/faktaunik?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = FAKTA_LIST[Math.floor(Math.random() * FAKTA_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
