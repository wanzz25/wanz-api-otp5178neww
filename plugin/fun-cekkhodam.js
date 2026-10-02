const KHODAM_LIST = [
  "Naga Geni dari Gunung Merapi", "Macan Putih Penjaga Hutan Larangan", "Burung Garuda Bersayap Emas",
  "Ular Sanca Kerajaan Laut Selatan", "Kucing Hitam Pembawa Hoki", "Serigala Bulan Purnama",
  "Kuda Sembrani Penunggang Angin", "Burung Hantu Penjaga Rahasia", "Rase Pemburu Malam",
  "Kerbau Bule Penjaga Sawah", "Elang Rajawali Pemecah Petir", "Komodo Penjaga Pulau Timur"
];
const ELEMEN_LIST = ["Api", "Air", "Angin", "Tanah", "Petir", "Es", "Cahaya", "Bayangan"];

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

module.exports = {
  name: "Cek Khodam",
  desc: "Hiburan: cek 'khodam' kocak berdasarkan nama. Hasil konsisten untuk nama yang sama (bukan ramalan sungguhan).",
  category: "Fun",
  path: "/api/fun/cekkhodam?apikey=&nama=Budi",
  async run(req, res) {
    const { apikey, nama } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!nama) {
      return res.status(400).json({ status: false, error: "Parameter 'nama' wajib diisi" });
    }

    const h = hashString(String(nama).toLowerCase().trim());
    const khodam = KHODAM_LIST[h % KHODAM_LIST.length];
    const elemen = ELEMEN_LIST[Math.floor(h / KHODAM_LIST.length) % ELEMEN_LIST.length];

    return res.status(200).json({
      status: true,
      nama,
      result: `Khodam ${nama} adalah ${khodam}, beranergi ${elemen}. (Hiburan semata, bukan hal mistis sungguhan)`
    });
  }
};
