const PICKUP_LIST = [
  "Are you a magician? Because whenever I look at you, everyone else disappears. (Kamu penyihir ya? Soalnya pas aku liat kamu, semua orang lain menghilang.)",
  "Do you have a map? I keep getting lost in your eyes. (Kamu punya peta? Soalnya aku terus tersesat di matamu.)",
  "If you were a vegetable, you'd be a cute-cumber. (Kalau kamu sayuran, kamu pasti 'cute-cumber' alias timun yang lucu.)",
  "Is your name Google? Because you have everything I've been searching for. (Namamu Google ya? Soalnya kamu punya semua yang aku cari.)"
];

module.exports = {
  name: "Pick Up Line (English)",
  desc: "Ambil 1 kalimat gombalan bahasa Inggris beserta terjemahannya.",
  category: "Fun",
  path: "/api/fun/pickupline-en?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = PICKUP_LIST[Math.floor(Math.random() * PICKUP_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
