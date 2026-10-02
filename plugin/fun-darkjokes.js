const DARKJOKES_LIST = [
  "Dompet akhir bulan itu bukan kosong, cuma lagi puasa isi.",
  "Hidup itu kayak ujian, kadang kita nyontek tapi tetep aja remedial.",
  "Semangat kerja cuma ada 2: awal bulan sama tanggal gajian.",
  "Mimpi itu gratis, makanya ambisius aja, toh bayarnya di kenyataan nanti.",
  "Rencana hidup rapi banget, sampe takdir ikut bingung mau ngerusak dari mana."
];

module.exports = {
  name: "Dark Jokes",
  desc: "Ambil 1 humor gelap (dark humor) satir ringan.",
  category: "Fun",
  path: "/api/fun/darkjokes?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = DARKJOKES_LIST[Math.floor(Math.random() * DARKJOKES_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
