const PANTUN_LIST = [
  "Jalan-jalan ke kota Blitar\nJangan lupa beli sukun\nKalau kamu rajin belajar\nMasa depan pasti beruntun",
  "Buah mangga buah kedondong\nDibawa pulang pakai keranjang\nKalau kamu lagi bingung\nCerita aja biar lega dan senang",
  "Pergi ke pasar beli ketupat\nJangan lupa beli juga lontong\nKalau kamu ingin cepat\nJangan lupa untuk gotong royong",
  "Ke sungai mencari ikan\nDapatnya malah ikan sepat\nKalau kamu ingin dikenang\nBerbuat baiklah dari sekarang"
];

module.exports = {
  name: "Pantun",
  desc: "Ambil 1 bait pantun jenaka atau nasihat 4 baris secara acak.",
  category: "Fun",
  path: "/api/fun/pantun?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = PANTUN_LIST[Math.floor(Math.random() * PANTUN_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
