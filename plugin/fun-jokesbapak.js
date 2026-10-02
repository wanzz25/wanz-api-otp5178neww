const JOKESBAPAK_LIST = [
  "Kenapa ayam nyebrang jalan? Karena di seberang ada tukang bakso langganan.",
  "Apa bedanya kamu sama kalender? Kalender ada tanggal merahnya, kamu bikin dompet bapak merah terus.",
  "Kenapa ikan gak suka main basket? Karena takut kena net.",
  "Ada tukang parkir jatuh cinta, judulnya apa? Parkir Hati.",
  "Kenapa kunang-kunang gak bisa jaga rahasia? Karena dia selalu bocorin cahaya."
];

module.exports = {
  name: "Jokes Bapak-Bapak",
  desc: "Ambil 1 lelucon receh khas bapak-bapak (dad jokes) bahasa Indonesia.",
  category: "Fun",
  path: "/api/fun/jokes-bapak?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = JOKESBAPAK_LIST[Math.floor(Math.random() * JOKESBAPAK_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
