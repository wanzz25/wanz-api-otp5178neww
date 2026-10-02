const DARE_LIST = [
  "Tiru gaya bicara temanmu selama 1 menit.",
  "Kirim pesan lucu ke kontak teratas di HP-mu.",
  "Nyanyikan satu lagu tanpa henti selama 30 detik.",
  "Tunjukkan foto paling lama di galeri HP-mu.",
  "Lakukan 10 push up sekarang juga.",
  "Bicara dengan aksen daerah selama 2 menit.",
  "Telepon orang acak di kontakmu dan nyanyikan selamat ulang tahun.",
  "Berjalan seperti robot selama 1 menit."
];

module.exports = {
  name: "Dare (Tantangan)",
  desc: "Ambil 1 tantangan seru (Dare) acak untuk permainan Truth or Dare.",
  category: "Fun",
  path: "/api/fun/dare?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = DARE_LIST[Math.floor(Math.random() * DARE_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
