const QUOTES = [
  { text: "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponnya.", author: "Charles R. Swindoll" },
  { text: "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas.", author: "Henry Ford" },
  { text: "Jangan tunggu waktu yang tepat, ciptakan waktu itu.", author: "Anonim" },
  { text: "Satu-satunya cara melakukan pekerjaan hebat adalah mencintai apa yang kamu kerjakan.", author: "Steve Jobs" },
  { text: "Bermimpilah setinggi langit, jika kau jatuh, kau akan jatuh di antara bintang-bintang.", author: "Soekarno" },
  { text: "Waktu adalah sesuatu yang tidak dapat kita beli, tetapi sering kita buang.", author: "Anonim" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Belajarlah dari kemarin, hiduplah untuk hari ini, berharaplah untuk esok hari.", author: "Albert Einstein" },
  { text: "Kesuksesan adalah guru yang buruk, ia menipu orang pintar untuk berpikir mereka tidak bisa kalah.", author: "Bill Gates" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" }
];

module.exports = {
  name: "Random Quote",
  desc: "Ambil satu kutipan motivasi acak (Indonesia & Inggris).",
  category: "Fun",
  path: "/api/fun/quote?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const result = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Random Quote Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
