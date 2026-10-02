module.exports = {
  name: "Dice Roll",
  desc: "Lempar dadu. Atur jumlah sisi (sides, default 6) dan jumlah dadu (count, default 1, maks 20).",
  category: "Fun",
  path: "/api/fun/diceroll?apikey=&sides=6&count=1",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const sides = Math.min(1000, Math.max(2, parseInt(q.sides, 10) || 6));
      const count = Math.min(20, Math.max(1, parseInt(q.count, 10) || 1));
      const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
      const total = rolls.reduce((a, b) => a + b, 0);
      return res.status(200).json({ status: true, result: { sides, count, rolls, total } });
    } catch (error) {
      console.error("Dice Roll Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
