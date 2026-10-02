const axios = require("axios");

module.exports = {
  name: "Chuck Norris Jokes",
  desc: "Lelucon ikonik Chuck Norris secara acak.",
  category: "Fun",
  path: "/api/fun/chucknorris?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }

    try {
      const response = await axios.get("https://api.chucknorris.io/jokes/random", { timeout: 15000 });
      return res.status(200).json({ status: true, result: response.data.value });
    } catch (error) {
      console.error("Chuck Norris Jokes Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
