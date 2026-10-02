const GALAU_LIST = [
  "Kadang yang bikin capek bukan keadaannya, tapi berharap keadaan itu berubah.",
  "Gak semua yang pergi harus dikejar, ada yang memang harus direlakan.",
  "Diam itu bukan berarti baik-baik saja, kadang itu cara biar gak nambah beban orang lain.",
  "Rindu itu aneh, pengen cerita tapi ke orangnya juga gak bisa.",
  "Kadang kita cuma butuh didengar, bukan dinasihati.",
  "Senyum di depan orang, nangis waktu sendirian, itu capek yang gak kelihatan."
];

module.exports = {
  name: "Kata-kata Galau",
  desc: "Ambil 1 kutipan kata-kata galau/sedih yang menyentuh hati secara acak.",
  category: "Fun",
  path: "/api/fun/galau?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = GALAU_LIST[Math.floor(Math.random() * GALAU_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
