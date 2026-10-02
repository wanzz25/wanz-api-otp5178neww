module.exports = {
  name: "Coin Flip",
  desc: "Lempar koin, hasil head atau tail.",
  category: "Fun",
  path: "/api/fun/coinflip?apikey=",
  async run(req, res) {
    const { apikey, ...q } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    try {
      const result = Math.random() < 0.5 ? "head" : "tail";
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("Coin Flip Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
