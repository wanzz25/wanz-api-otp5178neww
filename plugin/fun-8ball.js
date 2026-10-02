const ANSWERS = [
  "Ya, pasti.", "Kemungkinan besar iya.", "Sepertinya begitu.", "Tidak diragukan lagi.",
  "Fokus dan tanyakan lagi.", "Tanya lagi nanti.", "Lebih baik jangan diberitahu sekarang.",
  "Jangan berharap terlalu banyak.", "Jawabanku: tidak.", "Sumber-sumberku bilang tidak.",
  "Sangat meragukan.", "Kemungkinan kecil."
];

module.exports = {
  name: "Magic 8 Ball",
  desc: "Tanyakan sesuatu, dapat jawaban acak ala bola ajaib 8.",
  category: "Fun",
  path: "/api/fun/8ball?apikey=&question=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q.question) {
      return res.status(400).json({ status: false, error: "Parameter 'question' wajib diisi" });
    }
    try {
      const result = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      return res.status(200).json({ status: true, question: q.question, result });
    } catch (error) {
      console.error("Magic 8 Ball Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
