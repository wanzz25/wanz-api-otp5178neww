const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function terbilang(n) {
  n = Math.floor(Math.abs(n));
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilang(n - 10) + " belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " puluh" + (n % 10 ? " " + terbilang(n % 10) : "");
  if (n < 200) return "seratus" + (n % 100 ? " " + terbilang(n % 100) : "");
  if (n < 1000) return terbilang(Math.floor(n / 100)) + " ratus" + (n % 100 ? " " + terbilang(n % 100) : "");
  if (n < 2000) return "seribu" + (n % 1000 ? " " + terbilang(n % 1000) : "");
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " ribu" + (n % 1000 ? " " + terbilang(n % 1000) : "");
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " juta" + (n % 1000000 ? " " + terbilang(n % 1000000) : "");
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " miliar" + (n % 1000000000 ? " " + terbilang(n % 1000000000) : "");
  return terbilang(Math.floor(n / 1000000000000)) + " triliun" + (n % 1000000000000 ? " " + terbilang(n % 1000000000000) : "");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = {
  name: "Angka Terbilang",
  desc: "Ubah angka menjadi kalimat terbilang bahasa Indonesia resmi.",
  category: "Converter",
  path: "/api/converter/angka-terbilang?apikey=&angka=1250500",
  async run(req, res) {
    const { apikey, angka } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const n = parseInt(angka, 10);
    if (angka === undefined || Number.isNaN(n)) {
      return res.status(400).json({ status: false, error: "Parameter 'angka' wajib diisi dan berupa bilangan bulat" });
    }
    if (Math.abs(n) >= 1e15) {
      return res.status(400).json({ status: false, error: "Angka terlalu besar (maksimal di bawah 1 kuadriliun)" });
    }

    try {
      const words = (n < 0 ? "minus " : "") + (n === 0 ? "nol" : terbilang(n));
      const result = capitalize(words);
      return res.status(200).json({ status: true, angka: n, result });
    } catch (error) {
      console.error("Angka Terbilang Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
