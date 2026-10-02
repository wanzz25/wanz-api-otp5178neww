module.exports = {
  name: "Rock Paper Scissors",
  desc: "Main suit (batu/gunting/kertas) melawan bot. Kirim choice=batu|gunting|kertas.",
  category: "Fun",
  path: "/api/fun/rps?apikey=&choice=batu",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const opsi = ["batu", "gunting", "kertas"];
      const choice = String(q.choice || "").toLowerCase();
      if (!opsi.includes(choice)) {
        return res.status(400).json({ status: false, error: "Parameter 'choice' harus salah satu dari: batu, gunting, kertas" });
      }
      const bot = opsi[Math.floor(Math.random() * opsi.length)];
      let hasil = "seri";
      const menang = { batu: "gunting", gunting: "kertas", kertas: "batu" };
      if (choice !== bot) hasil = menang[choice] === bot ? "menang" : "kalah";
      return res.status(200).json({ status: true, result: { pemain: choice, bot, hasil } });
    } catch (error) {
      console.error("Rock Paper Scissors Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
