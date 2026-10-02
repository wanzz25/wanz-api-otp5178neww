'use strict';
// Router LLM multi-provider untuk semua endpoint AI berbasis teks.
// Tiap "model" dari plugin dipetakan ke daftar provider berurutan; kalau satu gagal, lanjut ke berikutnya.
// Key dibaca dari environment (lihat .env.ai / .env.example). Provider tanpa key dilewati otomatis.
const axios = require('axios');
const env = process.env;

const MAX_TOKENS = parseInt(env.LLM_MAX_TOKENS, 10) || 1500;   // batas keluaran (kontrol biaya)
const PER_TRY_MS = parseInt(env.LLM_TIMEOUT_MS, 10) || 15000;  // timeout tiap provider
const BUDGET_MS = 40000;                                       // total waktu sebelum menyerah (batas Vercel 60 dtk)

const oa = (url, keyEnv, model, o = {}) => Object.assign({ kind: 'openai', url, keyEnv, model, tokenField: 'max_tokens', headers: {}, maxTokens: MAX_TOKENS }, o);
const DS_URL = 'https://api.deepseek.com/chat/completions';
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OR_H = { 'X-Title': 'Wanz Api' };

const PROVIDERS = {
  openai: oa('https://api.openai.com/v1/chat/completions', 'OPENAI_API_KEY', () => env.OPENAI_MODEL || 'gpt-4o-mini', { tokenField: 'max_completion_tokens' }),
  groq: oa('https://api.groq.com/openai/v1/chat/completions', 'GROQ_API_KEY', () => env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
  mistral: oa('https://api.mistral.ai/v1/chat/completions', 'MISTRAL_API_KEY', () => env.MISTRAL_MODEL || 'mistral-small-latest'),
  deepseek: oa(DS_URL, 'DEEPSEEK_API_KEY', () => env.DEEPSEEK_MODEL || 'deepseek-chat'),
  'deepseek:reasoner': oa(DS_URL, 'DEEPSEEK_API_KEY', () => env.DEEPSEEK_REASONER_MODEL || 'deepseek-reasoner', { maxTokens: Math.max(MAX_TOKENS, 3000) }),
  openrouter: oa(OR_URL, 'OPENROUTER_API_KEY', () => env.OPENROUTER_MODEL || 'openrouter/auto', { headers: OR_H }),
  'openrouter:qwen': oa(OR_URL, 'OPENROUTER_API_KEY', () => env.OPENROUTER_QWEN_MODEL || 'qwen/qwen-2.5-coder-32b-instruct', { headers: OR_H }),
  'openrouter:search': oa(OR_URL, 'OPENROUTER_API_KEY', () => env.OPENROUTER_SEARCH_MODEL || 'perplexity/sonar', { headers: OR_H }),
  'openrouter:deepseek': oa(OR_URL, 'OPENROUTER_API_KEY', () => env.OPENROUTER_DEEPSEEK_MODEL || 'deepseek/deepseek-chat', { headers: OR_H }),
  // Gemini native (key baru berawalan "AQ." hanya jalan di endpoint native, bukan rute OpenAI-compatible)
  gemini: { kind: 'gemini', keyEnv: 'GEMINI_API_KEY', model: () => env.GEMINI_MODEL || 'gemini-flash-latest' }
};

// model dari plugin -> urutan provider
const CHAINS = {
  openai: ['openai', 'openrouter', 'gemini', 'groq', 'mistral', 'deepseek'],
  'openai-fast': ['openai', 'groq', 'gemini', 'openrouter', 'mistral'],
  gemini: ['gemini', 'openrouter', 'openai', 'groq', 'mistral'],
  llama: ['groq', 'openrouter', 'mistral', 'gemini', 'openai'],
  mistral: ['mistral', 'openrouter', 'groq', 'gemini', 'openai'],
  'qwen-coder': ['openrouter:qwen', 'deepseek', 'openai', 'groq', 'gemini'],
  searchgpt: ['openrouter:search', 'gemini', 'openai', 'groq'],
  'deepseek-reasoning': ['deepseek:reasoner', 'openrouter:deepseek', 'groq', 'openai']
};

const keyOf = id => String(env[PROVIDERS[id].keyEnv] || '').trim();
const hasProviders = () => Object.keys(PROVIDERS).some(keyOf);

// Provider yang baru saja gagal "didinginkan" sebentar agar request berikutnya tidak buang waktu
const cooldown = new Map();
const cooling = id => (cooldown.get(id) || 0) > Date.now();
function cool(id, status) {
  if ([401, 402, 403, 404].includes(status)) cooldown.set(id, Date.now() + 10 * 60e3); // key/model/saldo bermasalah
  else if (status !== 400) cooldown.set(id, Date.now() + 60e3);                       // limit/5xx/timeout
}

function fail(id, status, detail) {
  const e = new Error(`${id.split(':')[0]} ${status || 'error'}`); // jangan bocorkan isi respons ke pengguna
  e.status = status; e.detail = detail; return e;
}

async function post(id, url, body, headers) {
  let r;
  try {
    r = await axios.post(url, body, { headers: Object.assign({ 'Content-Type': 'application/json' }, headers), timeout: PER_TRY_MS, validateStatus: () => true });
  } catch (err) { throw fail(id, 0, err.message); }
  if (r.status < 200 || r.status >= 300) throw fail(id, r.status, JSON.stringify(r.data).slice(0, 200));
  return r.data;
}

async function call(id, prompt, system) {
  const p = PROVIDERS[id], key = keyOf(id), model = p.model();
  if (p.kind === 'gemini') {
    const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const d = await post(id, url, body, { 'x-goog-api-key': key });
    return ((d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || []).map(x => x.text || '').join('').trim();
  }
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  const d = await post(id, p.url, { model, messages, [p.tokenField]: p.maxTokens }, Object.assign({ Authorization: 'Bearer ' + key }, p.headers));
  const m = d.choices && d.choices[0] && d.choices[0].message;
  return String((m && m.content) || '').trim();
}

// Hedging: kalau provider pertama belum menjawab dalam LLM_HEDGE_MS (default 3,5 dtk), provider berikutnya
// dijalankan paralel dan jawaban tercepat dipakai. Provider yang gagal langsung digantikan berikutnya.
function chat(prompt, opts = {}) {
  const chain = (CHAINS[opts.model] || CHAINS.openai).filter(id => keyOf(id) && !cooling(id));
  if (!chain.length) return Promise.reject(new Error('Tidak ada provider LLM yang tersedia'));
  const hedgeMs = parseInt(env.LLM_HEDGE_MS, 10) || 3500;
  const start = Date.now(), errs = [];
  return new Promise((resolve, reject) => {
    let next = 0, running = 0, done = false, timer = null;
    const launch = () => {
      if (done) return;
      if (next >= chain.length || Date.now() - start > BUDGET_MS) {
        if (!running) { done = true; reject(new Error('Semua provider gagal (' + errs.join(', ') + ')')); }
        return;
      }
      const id = chain[next++];
      running++;
      clearTimeout(timer);
      if (next < chain.length && running < 2) timer = setTimeout(launch, hedgeMs);
      call(id, prompt, opts.system).then(text => {
        running--;
        if (done) return;
        if (text) { done = true; clearTimeout(timer); console.log(`[llm] ${opts.model || 'default'} -> ${id}`); resolve(text); }
        else { errs.push(`${id}: kosong`); launch(); }
      }).catch(e => {
        running--;
        cool(id, e.status);
        console.warn(`[llm] ${id} gagal: ${e.message} ${e.detail || ''}`.slice(0, 300));
        errs.push(e.message);
        launch();
      });
    };
    launch();
  });
}

module.exports = { chat, hasProviders, MODELS: Object.keys(CHAINS), _cooldown: cooldown };
