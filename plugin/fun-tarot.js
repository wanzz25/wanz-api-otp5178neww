const TAROT = [
  { nama: "The Fool", makna: "Awal baru, spontanitas, mengambil lompatan keyakinan." },
  { nama: "The Magician", makna: "Kemampuan mewujudkan keinginan, sumber daya yang cukup." },
  { nama: "The High Priestess", makna: "Intuisi, misteri, pengetahuan bawah sadar." },
  { nama: "The Empress", makna: "Kelimpahan, kesuburan, kehangatan." },
  { nama: "The Emperor", makna: "Otoritas, struktur, kendali." },
  { nama: "The Lovers", makna: "Hubungan, pilihan penting, keselarasan nilai." },
  { nama: "The Wheel of Fortune", makna: "Siklus hidup, takdir, titik balik." },
  { nama: "The Star", makna: "Harapan, inspirasi, penyembuhan." },
  { nama: "The Sun", makna: "Kebahagiaan, kesuksesan, vitalitas." },
  { nama: "The World", makna: "Penyelesaian, pencapaian, integrasi." }
];

module.exports = {
  name: "Tarot Draw",
  desc: "Ambil satu kartu tarot acak beserta makna singkatnya.",
  category: "Fun",
  path: "/api/fun/tarot?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const card = TAROT[Math.floor(Math.random() * TAROT.length)];
      const posisi = Math.random() < 0.5 ? "terbalik" : "normal";
      return res.status(200).json({ status: true, result: { ...card, posisi } });
    } catch (error) {
      console.error("Tarot Draw Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
