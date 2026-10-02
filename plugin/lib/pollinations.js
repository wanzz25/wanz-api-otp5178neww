const axios = require("axios");

// Tanpa key: endpoint lama (legacy). Dengan POLLINATIONS_API_KEY (dari https://enter.pollinations.ai/keys):
// endpoint terpadu gen.pollinations.ai + header Authorization Bearer.
const getKey = () => String(process.env.POLLINATIONS_API_KEY || "").trim();
const textBase = () => (getKey() ? "https://gen.pollinations.ai/text" : "https://text.pollinations.ai");
const imageBase = () => (getKey() ? "https://gen.pollinations.ai/image" : "https://image.pollinations.ai/prompt");
const authHeaders = () => {
  const h = { "User-Agent": "Mozilla/5.0" };
  if (getKey()) h.Authorization = "Bearer " + getKey();
  return h;
};

/**
 * Panggil Pollinations Text API (isi POLLINATIONS_API_KEY kalau endpoint lama menolak).
 * @param {string} prompt - teks/pertanyaan pengguna
 * @param {object} opts - { model, system }
 */
async function pollinationsText(prompt, opts = {}) {
  const { model = "openai", system } = opts;
  const params = { model };
  if (system) params.system = system;

  const res = await axios.get(`${textBase()}/${encodeURIComponent(prompt)}`, {
    params,
    timeout: 45000,
    responseType: "text",
    headers: authHeaders(),
    validateStatus: () => true
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Pollinations text API balas status ${res.status}`);
  }

  return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
}

/**
 * Ambil buffer gambar dari Pollinations Image API.
 * @param {string} prompt
 * @param {object} opts - { model, width, height }
 */
async function imageGen(prompt, opts = {}) {
  const { model = "flux", width = 1024, height = 1024 } = opts;
  const url = `${imageBase()}/${encodeURIComponent(prompt)}`;

  const res = await axios.get(url, {
    params: { model, width, height, nologo: "true" },
    responseType: "arraybuffer",
    timeout: 60000,
    headers: authHeaders(),
    validateStatus: () => true
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Pollinations image API balas status ${res.status}`);
  }

  return Buffer.from(res.data);
}

// Teks: coba provider resmi lewat llm.js (kalau ada key), terakhir Pollinations
async function textGen(prompt, opts = {}) {
  const llm = require("./llm");
  if (llm.hasProviders()) {
    try {
      return await llm.chat(prompt, opts);
    } catch (e) {
      console.warn("[llm] provider resmi gagal, coba Pollinations:", e.message);
    }
  }
  return pollinationsText(prompt, opts);
}

module.exports = { textGen, imageGen };
