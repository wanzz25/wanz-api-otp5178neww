const PRIA_DEPAN = ["Agus", "Budi", "Dedi", "Eko", "Fajar", "Gunawan", "Hendra", "Irfan", "Joko", "Krisna", "Lukman", "Made", "Nanda", "Oki", "Putra", "Rizky", "Surya", "Taufik", "Wahyu", "Yusuf"];
const WANITA_DEPAN = ["Ayu", "Bella", "Citra", "Dewi", "Eka", "Fitri", "Gita", "Hana", "Indah", "Juwita", "Kartika", "Lestari", "Maya", "Nadia", "Putri", "Rani", "Sari", "Tania", "Wulan", "Yuni"];
const BELAKANG = ["Saputra", "Wijaya", "Santoso", "Kusuma", "Pratama", "Wardani", "Setiawan", "Hidayat", "Nugroho", "Permata", "Gunawan", "Lestari", "Utama", "Handayani", "Firmansyah"];

module.exports = {
  name: "Random Indonesian Name Generator",
  desc: "Buat nama Indonesia acak. Atur gender=pria|wanita, kosongkan untuk acak.",
  category: "Fun",
  path: "/api/fun/randomname?apikey=&gender=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const gender = q.gender === "pria" || q.gender === "wanita" ? q.gender : (Math.random() < 0.5 ? "pria" : "wanita");
      const depanList = gender === "pria" ? PRIA_DEPAN : WANITA_DEPAN;
      const depan = depanList[Math.floor(Math.random() * depanList.length)];
      const belakang = BELAKANG[Math.floor(Math.random() * BELAKANG.length)];
      const result = `${depan} ${belakang}`;
      return res.status(200).json({ status: true, gender, result });
    } catch (error) {
      console.error("Random Indonesian Name Generator Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
