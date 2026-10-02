const ROMAN_MAP = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];

function toRoman(num) {
  let result = "";
  for (const [val, sym] of ROMAN_MAP) {
    while (num >= val) { result += sym; num -= val; }
  }
  return result;
}
function fromRoman(str) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  const s = str.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (!cur) return null;
    if (next && cur < next) total -= cur; else total += cur;
  }
  return total;
}

module.exports = {
  name: "Konversi Angka Romawi",
  desc: "Konversi bilangan bulat (1-3999) ke angka Romawi, atau sebaliknya. Kirim angka=2026 atau romawi=MMXXVI.",
  category: "Converter",
  path: "/api/converter/angka-romawi?apikey=&angka=2026",
  async run(req, res) {
    const { apikey, angka, romawi } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      if (angka !== undefined) {
        const n = parseInt(angka, 10);
        if (Number.isNaN(n) || n < 1 || n > 3999) {
          return res.status(400).json({ status: false, error: "'angka' harus antara 1 dan 3999" });
        }
        return res.status(200).json({ status: true, result: { angka: n, romawi: toRoman(n) } });
      }
      if (romawi !== undefined) {
        const n = fromRoman(String(romawi));
        if (n === null || n <= 0) {
          return res.status(400).json({ status: false, error: "Format angka Romawi tidak valid" });
        }
        return res.status(200).json({ status: true, result: { romawi: String(romawi).toUpperCase(), angka: n } });
      }
      return res.status(400).json({ status: false, error: "Isi salah satu dari 'angka' atau 'romawi'" });
    } catch (error) {
      console.error("Konversi Angka Romawi Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal memproses: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
