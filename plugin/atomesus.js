const axios = require('axios');

async function atomesusChat(message) {
    const response = await axios.post('https://api.atomesus.com/api/guest-chat', {
        message: message
    }, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
        }
    });
    
    return response.data.data;
}

module.exports = {
  name: "AI Atomesus",
  desc: "AI Chatbot sederhana dari atomesus.com.",
  category: "AI",
  path: "/api/ai/atomesus?apikey=&prompt=",
  async run(req, res) {
    const { apikey, prompt } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!prompt) {
      return res.status(400).json({ status: false, error: "Parameter 'prompt' wajib diisi" });
    }

    try {
      const result = await atomesusChat(prompt);
      
      return res.status(200).json({
        status: true,
        result: result
      });
    } catch (error) {
      try { // situs sumber gagal -> cadangan lewat provider resmi
        const { textGen } = require("./lib/pollinations");
        const result = await textGen(prompt, { model: "openai" });
        return res.status(200).json({ status: true, result: result, fallback: true });
      } catch (e2) {
        return res.status(500).json({
          status: false,
          error: error.message || "Gagal memproses permintaan AI"
        });
      }
    }
  }
};
