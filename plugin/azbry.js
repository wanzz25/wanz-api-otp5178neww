const axios = require('axios');

const MODELS = {
    aiko: {
        name: 'Aiko',
        endpoint: '/api/ai/aiko',
        system: 'You are Aiko, a helpful AI assistant from chat.azbry.com. You are powered by Llama 3.3 70B Versatile model. You were developed by febry.is-a.dev. Always respond in Bahasa Indonesia unless the user writes in another language. Be friendly, concise, and helpful.'
    },
    claude: {
        name: 'Claude',
        endpoint: '/api/ai/claude',
        system: 'You are Claude, a helpful AI assistant from chat.azbry.com. You are powered by Claude 3 Haiku model. You were developed by febry.is-a.dev. Always respond in Bahasa Indonesia unless the user writes in another language. Be analytical, detailed, and thorough.'
    }
};

async function azbryChat(message, model = 'aiko') {
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const API_BASE = 'https://chat.azbry.com';

    if (!MODELS[model]) {
        throw new Error(`Model "${model}" tidak tersedia. Pilih: aiko, claude`);
    }

    const tokenResponse = await axios.get(`${API_BASE}/api/token`, {
        headers: { 'User-Agent': UA }
    });

    const token = tokenResponse.data.token;
    if (!token) throw new Error('Gagal mendapatkan token');

    const config = MODELS[model];
    const fullPrompt = `${config.system}\n\nUser: ${message}`;

    const response = await axios.get(`${API_BASE}${config.endpoint}`, {
        params: {
            q: fullPrompt,
            token: token
        },
        headers: {
            'User-Agent': UA,
            'Accept': 'application/json'
        }
    });

    return response.data.response || response.data.result || 'Tidak ada respons';
}

module.exports = {
  name: "AI Azbry",
  desc: "AI Chatbot scraper auto token. List model yang bisa diinput: 'aiko' (Llama 3.3 70B) atau 'claude' (Claude 3 Haiku).",
  category: "AI",
  path: "/api/ai/azbry?apikey=&prompt=&model=aiko",
  
  async run(req, res) {
    const { apikey, prompt, model } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({
        status: false,
        error: "Apikey tidak valid atau tidak diisi."
      });
    }

    if (!prompt) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'prompt' wajib diisi."
      });
    }

    const selectedModel = model ? model.toLowerCase() : 'aiko';

    try {
      const result = await azbryChat(prompt, selectedModel);
      
      return res.status(200).json({
        status: true,
        model: MODELS[selectedModel]?.name || selectedModel,
        result: result
      });
      
    } catch (error) {
      try { // situs sumber gagal -> cadangan lewat provider resmi
        const { textGen } = require("./lib/pollinations");
        const result = await textGen(prompt, { model: selectedModel === 'aiko' ? 'llama' : 'openai' });
        return res.status(200).json({ status: true, model: selectedModel, result: result, fallback: true });
      } catch (e2) {
        return res.status(500).json({
          status: false,
          error: error.message || "Gagal memproses prompt AI."
        });
      }
    }
  }
};
