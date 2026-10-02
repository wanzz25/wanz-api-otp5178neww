const JOKES = [
  "Kenapa komputer sering kedinginan? Karena banyak windows-nya kebuka.",
  "Apa bedanya kamu sama laptop? Laptop ada chargernya, kamu enggak pernah ngecharge hidupku.",
  "Kenapa ikan gak suka main basket? Karena takut kena net.",
  "Ada anak panah nyasar ke gurun. Namanya apa? Asa hara.",
  "Kenapa semut gak pernah sakit gigi? Karena semut kalau gigit ya gigit, bukan dikunyah.",
  "Apa bedanya sate sama satai? Satu huruf, tapi harganya beda pas ditambah 'i'.",
  "Kenapa kunang-kunang gak bisa jaga rahasia? Karena dia selalu bocorin cahaya.",
  "Hewan apa yang paling jujur? Ular, soalnya nggak bisa munafik alias tidak punya kaki untuk kabur."
];

module.exports = {
  name: "Random Dad Joke",
  desc: "Dapatkan satu lelucon garing (dad joke) acak.",
  category: "Fun",
  path: "/api/fun/dadjoke?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const result = JOKES[Math.floor(Math.random() * JOKES.length)];
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Random Dad Joke Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
