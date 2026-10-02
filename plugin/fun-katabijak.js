const KATABIJAK_LIST = [
  "Hidup yang tidak diuji bukanlah hidup yang layak dijalani. — Socrates",
  "Kita adalah apa yang kita lakukan berulang kali. Keunggulan bukanlah tindakan, melainkan kebiasaan. — Aristoteles",
  "Satu-satunya hal yang perlu kita takuti adalah rasa takut itu sendiri. — Franklin D. Roosevelt",
  "Jadilah perubahan yang ingin kamu lihat di dunia. — Mahatma Gandhi",
  "Imajinasi lebih penting daripada pengetahuan. — Albert Einstein",
  "Hidup adalah 10 persen apa yang terjadi padamu dan 90 persen bagaimana kamu meresponnya. — Charles R. Swindoll"
];

module.exports = {
  name: "Kata Bijak",
  desc: "Ambil 1 kutipan kata bijak dari tokoh dunia atau filsuf terkenal beserta nama tokohnya.",
  category: "Fun",
  path: "/api/fun/katabijak?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = KATABIJAK_LIST[Math.floor(Math.random() * KATABIJAK_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
