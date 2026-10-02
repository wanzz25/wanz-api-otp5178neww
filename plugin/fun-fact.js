const FACTS = [
  "Madu tidak pernah basi jika disimpan dengan benar, bahkan madu berusia ribuan tahun masih bisa dimakan.",
  "Jantung udang terletak di kepalanya.",
  "Satu hari di planet Venus lebih lama daripada satu tahun di Venus.",
  "Otak manusia menggunakan sekitar 20% energi tubuh meski hanya 2% dari berat badan.",
  "Bank sperma pertama di dunia dibuka pada tahun 1970-an.",
  "Kupu-kupu bisa merasakan rasa dengan kakinya.",
  "Gurita punya tiga jantung dan darah berwarna biru.",
  "Menara Eiffel bisa bertambah tinggi sekitar 15 cm saat musim panas karena pemuaian logam.",
  "Bintang laut tidak punya otak maupun darah.",
  "Suara petir bisa terdengar hingga jarak 15 km jauhnya."
];

module.exports = {
  name: "Random Fact",
  desc: "Dapatkan satu fakta unik acak.",
  category: "Fun",
  path: "/api/fun/fact?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const result = FACTS[Math.floor(Math.random() * FACTS.length)];
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Random Fact Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
