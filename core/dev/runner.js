'use strict';
// Validasi + eksekusi endpoint custom buatan dev page. Tipe: proxy, ai, image, static. (Tanpa JS bebas, sengaja.)
const axios = require('axios');
const ssrf = require('./ssrf');

const MAX_BYTES = 8 * 1024 * 1024;
const PARAM_MAX = 4000;
const BLOCKED_ENV = new Set(['ADMIN_PASSWORD', 'SESSION_SECRET', 'DEV_PASSWORD', 'DEV_API_KEY', 'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_TOKEN', 'GOOGLE_CLIENT_SECRET', 'SMTP_PASS']);
const RESERVED_PATHS = new Set(['/api', '/api/stats', '/api/logo-proxy']);
const TYPES = ['proxy', 'ai', 'image', 'static'];
const IMAGE_MODELS = ['flux', 'turbo', 'gptimage'];
const SAFE_RAW_TYPES = /^(image\/(png|jpe?g|gif|webp|avif)|audio\/[\w.+-]+|video\/[\w.+-]+|application\/(json|pdf|octet-stream)|text\/(plain|csv|xml))/i;

class DevError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = m => new DevError(400, m);

// ---------- template ----------
function expand(tpl, params, mode) {
  return String(tpl || '').replace(/\{(env\.)?([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, isEnv, name) => {
    let v;
    if (isEnv) {
      if (BLOCKED_ENV.has(name)) return '';
      v = process.env[name] || '';
    } else v = params[name] == null ? '' : String(params[name]);
    if (isEnv) return v.replace(/[\r\n]/g, '');
    if (mode === 'url' || mode === 'form') return encodeURIComponent(v);
    if (mode === 'json') return JSON.stringify(v).slice(1, -1);
    return v;
  });
}

function pickPath(data, path) {
  if (!path) return data;
  const parts = String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = data;
  for (const k of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

// ---------- validasi definisi ----------
const strOf = (v, max, label, { required = true } = {}) => {
  const s = String(v == null ? '' : v).trim();
  if (required && !s) throw bad(`${label} wajib diisi`);
  if (s.length > max) throw bad(`${label} maksimal ${max} karakter`);
  return s;
};

function parseParams(input) {
  const arr = Array.isArray(input) ? input : [];
  if (arr.length > 12) throw bad('Maksimal 12 parameter');
  const seen = new Set();
  return arr.map(p => {
    const name = String((p && p.name) || '').trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,30}$/.test(name)) throw bad(`Nama parameter tidak valid: "${name}"`);
    if (name.toLowerCase() === 'apikey') throw bad("Parameter 'apikey' sudah dipakai sistem");
    if (seen.has(name)) throw bad(`Parameter ganda: ${name}`);
    seen.add(name);
    return { name, required: !!p.required, default: p.default == null ? '' : String(p.default).slice(0, 500) };
  });
}

function validateProxyUrl(url) {
  const m = String(url).match(/^(https?):\/\/([^\/?#]*)/i);
  if (!m) throw bad('URL harus diawali http:// atau https://');
  if (/[{}@]/.test(m[2])) throw bad('Bagian host URL tidak boleh memuat {parameter} atau @. Parameter hanya boleh di path/query.');
  // validasi host dengan placeholder diganti dummy
  try { ssrf.assertPublicUrl(String(url).replace(/\{[^}]*\}/g, 'x')); }
  catch (e) { throw bad('URL ditolak: ' + e.message); }
}

function validateEndpoint(input, ctx = {}) {
  const i = input || {};
  const type = String(i.type || '');
  if (!TYPES.includes(type)) throw bad('Tipe endpoint tidak valid');
  const name = strOf(i.name, 60, 'Nama');
  const desc = strOf(i.desc, 400, 'Deskripsi');
  let category = strOf(i.category, 40, 'Kategori').replace(/^tools\s*-\s*/i, '');
  if (!/^[\p{L}\p{N} _&.+-]+$/u.test(category)) throw bad('Nama kategori hanya boleh huruf, angka, spasi, dan _ & . + -');
  const known = (ctx.knownCategories || []).find(c => c.toLowerCase() === category.toLowerCase());
  if (known) category = known; // samakan huruf besar/kecil dengan kategori yang sudah ada

  let path = String(i.path || '').trim().toLowerCase().replace(/\/+$/, '');
  if (!/^\/api\/[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*){0,3}$/.test(path) || path.length > 80 || path.includes('..')) {
    throw bad('Path harus seperti /api/custom/nama (huruf kecil, angka, titik, strip; maksimal 4 segmen)');
  }
  if (RESERVED_PATHS.has(path)) throw bad('Path ini dicadangkan sistem');
  if ((ctx.staticPaths || new Set()).has(path)) throw bad('Path bentrok dengan endpoint bawaan');
  for (const e of Object.values(ctx.endpoints || {})) {
    if (e.path === path && e.id !== ctx.selfId) throw bad('Path sudah dipakai endpoint custom lain');
  }

  const params = parseParams(i.params);
  const out = { id: ctx.selfId, name, desc, category, path, type, params };

  if (type === 'proxy') {
    const p = i.proxy || {};
    const url = strOf(p.url, 1000, 'URL sumber');
    validateProxyUrl(url);
    const method = String(p.method || 'GET').toUpperCase();
    if (!['GET', 'POST'].includes(method)) throw bad('Method hanya GET atau POST');
    const response = String(p.response || 'json');
    if (!['json', 'text', 'raw'].includes(response)) throw bad('Mode respons tidak valid');
    const bodyType = String(p.bodyType || 'json');
    if (!['json', 'form', 'text'].includes(bodyType)) throw bad('Tipe body tidak valid');
    const headers = {};
    for (const [k, v] of Object.entries(p.headers || {})) {
      if (!/^[A-Za-z0-9-]{1,40}$/.test(k)) throw bad(`Nama header tidak valid: ${k}`);
      if (/^(host|content-length|connection|transfer-encoding)$/i.test(k)) throw bad(`Header ${k} tidak boleh diatur`);
      headers[k] = String(v).slice(0, 1000);
    }
    if (Object.keys(headers).length > 10) throw bad('Maksimal 10 header');
    out.proxy = { url, method, headers, body: String(p.body || '').slice(0, 4000), bodyType, response, jsonPath: String(p.jsonPath || '').slice(0, 120) };
  } else if (type === 'ai') {
    const a = i.ai || {};
    const model = String(a.model || 'openai');
    if (!(ctx.aiModels || []).includes(model)) throw bad('Model AI tidak valid');
    out.ai = { prompt: strOf(a.prompt, 8000, 'Prompt'), system: String(a.system || '').slice(0, 2000), model };
  } else if (type === 'image') {
    const a = i.image || {};
    const model = String(a.model || 'flux');
    if (!IMAGE_MODELS.includes(model)) throw bad('Model gambar tidak valid');
    const clamp = (v, d) => Math.min(1536, Math.max(256, parseInt(v, 10) || d));
    out.image = { prompt: strOf(a.prompt, 2000, 'Prompt gambar'), model, width: clamp(a.width, 1024), height: clamp(a.height, 1024) };
  } else {
    const s = i.static || {};
    const contentType = String(s.contentType || 'application/json');
    if (!['application/json', 'text/plain'].includes(contentType)) throw bad('Content-Type statis hanya JSON atau teks');
    const body = String(s.body == null ? '' : s.body);
    if (body.length > 20000) throw bad('Isi statis maksimal 20.000 karakter');
    if (contentType === 'application/json') { try { JSON.parse(body); } catch (_) { throw bad('Isi bukan JSON yang valid'); } }
    out.static = { contentType, body };
  }
  return out;
}

// ---------- eksekusi ----------
function collectParams(def, query) {
  const params = {};
  for (const p of def.params || []) {
    let v = query[p.name];
    if (Array.isArray(v)) v = v[0];
    v = v == null ? '' : String(v);
    if (!v && p.default) v = p.default;
    if (!v && p.required) throw bad(`Parameter '${p.name}' wajib diisi`);
    if (v.length > PARAM_MAX) throw bad(`Parameter '${p.name}' terlalu panjang (maks ${PARAM_MAX})`);
    params[p.name] = v;
  }
  return params;
}

async function fetchGuarded(def, params) {
  const p = def.proxy;
  let url = expand(p.url, params, 'url');
  let method = p.method;
  const headers = { 'User-Agent': 'Mozilla/5.0 (WanzApi)', Accept: '*/*' };
  for (const [k, v] of Object.entries(p.headers || {})) headers[k] = expand(v, params, 'raw').replace(/[\r\n]/g, '');
  let data;
  if (method === 'POST' && p.body) {
    data = expand(p.body, params, p.bodyType === 'json' ? 'json' : p.bodyType === 'form' ? 'form' : 'raw');
    headers['Content-Type'] = p.bodyType === 'json' ? 'application/json' : p.bodyType === 'form' ? 'application/x-www-form-urlencoded' : 'text/plain';
  }
  for (let hop = 0; hop <= 3; hop++) {
    try { ssrf.assertPublicUrl(url); }
    catch (e) { throw new DevError(400, 'URL tujuan ditolak: ' + e.message); }
    let r;
    try {
      r = await axios.request({
        url, method, headers, data, timeout: 15000, maxRedirects: 0, responseType: 'arraybuffer',
        maxContentLength: MAX_BYTES, maxBodyLength: MAX_BYTES, validateStatus: () => true,
        httpAgent: ssrf.httpAgent, httpsAgent: ssrf.httpsAgent, decompress: true
      });
    } catch (e) { throw new DevError(502, 'Gagal menghubungi sumber: ' + String(e.message).slice(0, 150)); }
    if ([301, 302, 303, 307, 308].includes(r.status) && r.headers && r.headers.location) {
      url = new URL(r.headers.location, url).toString();
      if (r.status === 303 || ((r.status === 301 || r.status === 302) && method === 'POST')) { method = 'GET'; data = undefined; }
      continue;
    }
    return r;
  }
  throw new DevError(502, 'Terlalu banyak redirect dari sumber');
}

function sniffImage(buf) {
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

// Mengembalikan { kind:'json', json } | { kind:'buffer', contentType, buffer } | { kind:'text', text }
async function runEndpoint(def, query) {
  const params = collectParams(def, query);
  if (def.type === 'static') {
    if (def.static.contentType === 'application/json') return { kind: 'json', json: { status: true, result: JSON.parse(def.static.body) } };
    return { kind: 'text', text: def.static.body };
  }
  if (def.type === 'ai') {
    const { textGen } = require('../../plugin/lib/pollinations');
    const prompt = expand(def.ai.prompt, params, 'raw').slice(0, 12000);
    const system = def.ai.system ? expand(def.ai.system, params, 'raw') : undefined;
    let text;
    try { text = await textGen(prompt, { model: def.ai.model, system }); }
    catch (e) { throw new DevError(502, 'AI gagal menjawab: ' + String(e.message).slice(0, 150)); }
    return { kind: 'json', json: { status: true, result: text } };
  }
  if (def.type === 'image') {
    const { imageGen } = require('../../plugin/lib/pollinations');
    const prompt = expand(def.image.prompt, params, 'raw').slice(0, 2000);
    let buf;
    try { buf = await imageGen(prompt, { model: def.image.model, width: def.image.width, height: def.image.height }); }
    catch (e) { throw new DevError(502, 'Gagal membuat gambar: ' + String(e.message).slice(0, 150)); }
    return { kind: 'buffer', contentType: sniffImage(buf), buffer: buf };
  }
  // proxy
  const r = await fetchGuarded(def, params);
  if (r.status < 200 || r.status >= 300) throw new DevError(502, `Sumber membalas HTTP ${r.status}`);
  const buf = Buffer.from(r.data);
  const ct = String((r.headers && r.headers['content-type']) || '').split(';')[0].trim().toLowerCase();
  const mode = def.proxy.response;
  if (mode === 'raw') {
    const safe = SAFE_RAW_TYPES.test(ct) ? ct : (/^text\//.test(ct) ? 'text/plain' : 'application/octet-stream');
    return { kind: 'buffer', contentType: safe, buffer: buf };
  }
  const text = buf.toString('utf8');
  if (mode === 'text') return { kind: 'json', json: { status: true, result: text } };
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) { throw new DevError(502, 'Respons sumber bukan JSON'); }
  const picked = pickPath(parsed, def.proxy.jsonPath);
  if (picked === undefined) throw new DevError(502, `Path hasil '${def.proxy.jsonPath}' tidak ditemukan di respons sumber`);
  return { kind: 'json', json: { status: true, result: picked } };
}

function listingPath(def) {
  return def.path + '?apikey=' + (def.params || []).map(p => '&' + p.name + '=').join('');
}

module.exports = { DevError, expand, pickPath, validateEndpoint, runEndpoint, collectParams, listingPath, TYPES };
