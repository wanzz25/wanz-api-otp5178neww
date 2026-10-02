const GOMBAL_LIST = [
  "Kamu tau gak bedanya kamu sama bintang? Kalo bintang kerlap-kerlip di langit, kamu kerlap-kerlip di hati aku.",
  "Kamu pasti capek ya, soalnya dari tadi muter-muter terus di pikiran aku.",
  "Boleh pinjem KTP-nya? Soalnya aku mau pastiin tanggal lahirmu itu tanggal merah di hati aku.",
  "Kamu kerja di pom bensin ya? Soalnya bikin aku full tank semangat.",
  "Kalau kamu itu chord, pasti aku gampang nyanyi karena pas banget di hati."
];

module.exports = {
  name: "Gombalan",
  desc: "Ambil 1 kalimat rayuan gombal maut secara acak.",
  category: "Fun",
  path: "/api/fun/gombalan?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = GOMBAL_LIST[Math.floor(Math.random() * GOMBAL_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
