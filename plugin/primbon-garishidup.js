const DESKRIPSI = {
  1: "Pemimpin alami: mandiri, ambisius, dan suka memulai hal baru.",
  2: "Diplomatis: sensitif, kooperatif, dan pandai menjaga keharmonisan.",
  3: "Ekspresif: kreatif, komunikatif, dan punya selera humor tinggi.",
  4: "Pekerja keras: disiplin, terstruktur, dan bisa diandalkan.",
  5: "Petualang: suka kebebasan, adaptif, dan haus pengalaman baru.",
  6: "Pengasuh: bertanggung jawab, penyayang, dan berorientasi keluarga.",
  7: "Pemikir: analitis, spiritual, dan gemar merenung/mencari makna.",
  8: "Ambisius: berorientasi pada pencapaian, materi, dan kekuasaan.",
  9: "Humanis: dermawan, idealis, dan peduli pada sesama.",
  11: "Angka master: intuitif tinggi, inspiratif, punya potensi spiritual besar.",
  22: "Angka master: pembangun hebat, visioner yang bisa mewujudkan mimpi besar.",
  33: "Angka master: guru spiritual, penuh kasih dan pengabdian pada sesama."
};

function reduce(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((a, d) => a + parseInt(d, 10), 0);
  }
  return n;
}

module.exports = {
  name: "Life Path Number (Numerologi)",
  desc: "Hitung Life Path Number (numerologi 1-9, atau angka master 11/22/33) dari tanggal lahir. Parameter: tgl, bln, thn.",
  category: "Primbon",
  path: "/api/primbon/garis-hidup?apikey=&tgl=17&bln=8&thn=1998",
  async run(req, res) {
    const { apikey, tgl, bln, thn } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!tgl || !bln || !thn) {
      return res.status(400).json({ status: false, error: "Parameter 'tgl', 'bln', dan 'thn' wajib diisi" });
    }
    const d = parseInt(tgl, 10), m = parseInt(bln, 10), y = parseInt(thn, 10);
    if ([d, m, y].some(Number.isNaN) || d < 1 || d > 31 || m < 1 || m > 12) {
      return res.status(400).json({ status: false, error: "Tanggal tidak valid" });
    }

    try {
      const rd = reduce(d), rm = reduce(m), ry = reduce(y);
      const lifePath = reduce(rd + rm + ry);
      return res.status(200).json({
        status: true,
        result: { tanggalLahir: `${tgl}-${bln}-${thn}`, lifePathNumber: lifePath, deskripsi: DESKRIPSI[lifePath] }
      });
    } catch (error) {
      console.error("Life Path Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal menghitung: " + String(error.message || error).slice(0, 300) });
    }
  }
};
