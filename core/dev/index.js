'use strict';
// Dev page (/dev) + API admin (/dev-api/*): endpoint custom, matikan endpoint/kategori, ban user.
const crypto = require('crypto');
const path = require('path');
const store = require('../store');
const cats = require('../categories');
const auth = require('../auth');
const runner = require('./runner');
const { DevError } = runner;

const TTL = 10000;            // cache config per instance (perubahan antar-instance terlihat <= 10 dtk)
const MAX_ENDPOINTS = 200;
const COOKIE = 'wanz_admin';
const SESSION_TTL = 8 * 3600; // 8 jam

// ---------- admin auth (terpisah dari login user/dev) ----------
const adminPassword = () => String(process.env.ADMIN_PASSWORD || '').trim();
const adminEnabled = () => adminPassword().length >= 12;
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
// Kunci tanda tangan diturunkan dari ADMIN_PASSWORD, jadi SESSION_SECRET saja tidak cukup untuk memalsukan sesi admin
const sigKey = () => sha('wanz-admin|' + (process.env.SESSION_SECRET || '') + '|' + adminPassword());
const sign = body => crypto.createHmac('sha256', sigKey()).update(body).digest('base64url');

function makeSession() {
  const body = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL, n: crypto.randomBytes(8).toString('hex') })).toString('base64url');
  return body + '.' + sign(body);
}
function isAdmin(req) {
  if (!adminEnabled()) return false;
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [body, sig] = m[1].split('.');
  if (!body || !sig || !safeEqual(sig, sign(body))) return false;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now() / 1000; } catch (_) { return false; }
}
const setCookie = (req, res, value, maxAge) => res.setHeader('Set-Cookie',
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${req.secure ? '; Secure' : ''}`);

const fails = new Map();
let globalFails = { n: 0, until: 0 };

// ---------- state (config tersimpan) ----------
const EMPTY = () => ({ v: 1, endpoints: {}, disabledPaths: [], disabledCategories: [], overrides: {} });
let state = null, loadedAt = 0, loading = null;
let derived = { disabled: new Set(), lockedCats: new Set(), dynByPath: new Map() };
let staticEntries = [];
const staticPaths = new Set();
const staticByPath = new Map();

const normPath = p => String(p || '').toLowerCase().split('?')[0].replace(/\/+$/, '');
const lc = s => String(s || '').toLowerCase();

function normalizeState(c) {
  const s = Object.assign(EMPTY(), c && typeof c === 'object' ? c : {});
  s.endpoints = s.endpoints && typeof s.endpoints === 'object' ? s.endpoints : {};
  s.disabledPaths = [...new Set((Array.isArray(s.disabledPaths) ? s.disabledPaths : []).map(normPath))];
  s.disabledCategories = [...new Set(Array.isArray(s.disabledCategories) ? s.disabledCategories : [])];
  s.overrides = s.overrides && typeof s.overrides === 'object' ? s.overrides : {};
  return s;
}
function rebuild() {
  derived = {
    disabled: new Set(state.disabledPaths),
    lockedCats: new Set(state.disabledCategories.map(lc)),
    dynByPath: new Map(Object.values(state.endpoints).map(e => [e.path, e]))
  };
}
function refresh() {
  if (loading) return loading;
  loading = (async () => {
    try {
      state = normalizeState(await store.getConfig('dev'));
      loadedAt = Date.now();
    } catch (e) {
      console.error('[dev] gagal memuat config:', e.message);
      if (!state) state = EMPTY();
      loadedAt = Date.now() - TTL + 5000; // coba lagi 5 detik kemudian
    } finally { loading = null; }
    rebuild();
    return state;
  })();
  return loading;
}
// Request biasa tidak pernah menunggu Redis: data basi dipakai dulu, disegarkan di belakang layar
async function load(force) {
  if (!state || force) return refresh();
  if (Date.now() - loadedAt >= TTL) refresh();
  return state;
}
async function mutate(fn) {
  await load(true);
  fn(state);
  await store.setConfig('dev', state);
  loadedAt = Date.now();
  rebuild();
}

function registerStatic(entry) {
  staticEntries.push(entry);
  staticPaths.add(normPath(entry.cleanPath));
  staticByPath.set(normPath(entry.cleanPath), entry);
}

// Kategori endpoint BAWAAN saja (dipakai cache respons); endpoint custom tidak di-cache
function cacheCategory(p) {
  if (!state || derived.dynByPath.has(p)) return '';
  const ov = state.overrides[p];
  const s = staticByPath.get(p);
  return s ? ((ov && ov.category) || s.category) : '';
}

function categoryOf(p) {
  const dyn = derived.dynByPath.get(p);
  if (dyn) return dyn.category;
  const ov = state && state.overrides[p];
  if (ov && ov.category) return ov.category;
  const s = staticByPath.get(p);
  return s ? s.category : '';
}

// ---------- middleware publik ----------
async function guard(req, res, next) {
  if (!req.path.startsWith('/api/')) return next();
  try {
    await load();
    const p = normPath(req.path);
    if (derived.disabled.has(p)) {
      return res.status(503).json({ status: false, disabled: true, error: 'Endpoint ini sedang dinonaktifkan' });
    }
    const cat = categoryOf(p);
    if (cat && derived.lockedCats.has(lc(cat))) {
      return res.status(403).json({ status: false, locked: true, error: 'Kategori ini sedang dikunci dan dinonaktifkan oleh admin.' });
    }
  } catch (e) { console.error('[dev guard]', e.message); }
  next();
}

function sendResult(res, out) {
  if (out.kind === 'json') return res.status(200).json(out.json);
  if (out.kind === 'text') { res.setHeader('X-Content-Type-Options', 'nosniff'); return res.status(200).type('text/plain; charset=utf-8').send(out.text); }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', out.contentType);
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  return res.status(200).send(out.buffer);
}

async function dynamic(req, res, next) {
  if (req.method !== 'GET' || !req.path.startsWith('/api/')) return next();
  try {
    await load();
    const def = derived.dynByPath.get(normPath(req.path));
    if (!def) return next();
    sendResult(res, await runner.runEndpoint(def, req.query));
  } catch (e) {
    if (e instanceof DevError) return res.status(e.status).json({ status: false, error: e.message });
    console.error('[dev dynamic]', e.message);
    if (!res.headersSent) res.status(500).json({ status: false, error: 'Gagal memproses endpoint' });
  }
}

// ---------- listing publik (/endpoints) ----------
async function listing() {
  await load();
  const groups = {};
  let total = 0, totalLocked = 0, totalDisabled = 0;
  const put = (e, category, locked, disabled) => {
    const key = locked ? cats.lockedLabel(category) : category;
    (groups[key] = groups[key] || []).push({
      name: e.name,
      desc: (locked ? '[TERKUNCI] ' : disabled ? '[NONAKTIF] ' : '') + e.desc,
      path: e.path, cleanPath: e.cleanPath,
      ...(locked ? { locked: true } : {}), ...(disabled && !locked ? { disabled: true } : {})
    });
    if (locked) totalLocked++; else if (disabled) totalDisabled++; else total++;
  };
  for (const e of staticEntries) {
    const p = normPath(e.cleanPath), ov = state.overrides[p] || {};
    const category = ov.category || e.category;
    put({ name: ov.name || e.name, desc: ov.desc || e.desc, path: e.path, cleanPath: e.cleanPath },
      category, e.locked || derived.lockedCats.has(lc(category)), derived.disabled.has(p));
  }
  for (const d of Object.values(state.endpoints)) {
    put({ name: d.name, desc: d.desc, path: runner.listingPath(d), cleanPath: d.path },
      d.category, derived.lockedCats.has(lc(d.category)), derived.disabled.has(d.path));
  }
  const sorted = {};
  for (const k of Object.keys(groups).sort((a, b) => a.localeCompare(b))) sorted[k] = groups[k].sort((a, b) => a.name.localeCompare(b.name));
  return { total, totalLocked, totalDisabled, endpoints: sorted };
}

// ---------- API admin ----------
const SEC_HEADERS = {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
};
const secure = res => { for (const [k, v] of Object.entries(SEC_HEADERS)) res.setHeader(k, v); };

const LOGIN_HTML = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Dev</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0f;color:#e8e8ee;font:16px system-ui,sans-serif}
.b{width:min(92vw,340px);background:#15151c;border:1px solid #26263a;border-radius:14px;padding:22px}h1{margin:0 0 14px;font-size:1.15rem}
input,button{width:100%;padding:12px;border-radius:10px;border:1px solid #2c2c44;background:#0f0f16;color:inherit;font:inherit;margin-top:10px}
button{background:#6d5efc;border-color:#6d5efc;font-weight:600;cursor:pointer}p{color:#ff8a8a;font-size:.85rem;min-height:1.2em;margin:10px 0 0}</style></head>
<body><form class="b" id="f"><h1>Dev page</h1><input id="p" type="password" placeholder="Password admin" autocomplete="current-password" autofocus><button>Masuk</button><p id="e"></p></form>
<script>document.getElementById('f').onsubmit=async function(ev){ev.preventDefault();var e=document.getElementById('e');e.textContent='';
try{var r=await fetch('/dev-api/login',{method:'POST',headers:{'Content-Type':'application/json','X-Dev-Request':'1'},body:JSON.stringify({password:document.getElementById('p').value})});
var d=await r.json().catch(function(){return{}});if(r.ok)location.reload();else e.textContent=d.error||'Gagal masuk'}catch(x){e.textContent='Gagal terhubung'}}</script></body></html>`;
const OFF_HTML = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dev</title><body style="font:16px system-ui;background:#0b0b0f;color:#e8e8ee;padding:24px"><h3>Dev page belum aktif</h3><p>Isi environment <code>ADMIN_PASSWORD</code> (minimal 12 karakter) lalu redeploy.</p></body>`;

function page(req, res) {
  secure(res);
  if (!adminEnabled()) return res.status(503).type('html').send(OFF_HTML);
  if (!isAdmin(req)) return res.status(200).type('html').send(LOGIN_HTML);
  res.sendFile(path.join(__dirname, '..', 'admin', 'dev.html'));
}

const ok = (res, data) => res.json(Object.assign({ status: true }, data));
const fail = (res, code, error) => res.status(code).json({ status: false, error });

function requireAdmin(req, res, next) {
  secure(res);
  if (!adminEnabled()) return fail(res, 503, 'ADMIN_PASSWORD belum diisi');
  if (!isAdmin(req)) return fail(res, 401, 'Belum login admin');
  if (req.method !== 'GET' && (req.headers['x-dev-request'] !== '1' || !/application\/json/i.test(req.headers['content-type'] || ''))) {
    return fail(res, 403, 'Permintaan ditolak');
  }
  next();
}

async function allCategories() {
  await load();
  const set = new Map();
  const add = c => { if (c && !set.has(lc(c))) set.set(lc(c), c); };
  for (const e of staticEntries) { const ov = state.overrides[normPath(e.cleanPath)]; add((ov && ov.category) || e.category); }
  for (const d of Object.values(state.endpoints)) add(d.category);
  return [...set.values()].sort((a, b) => a.localeCompare(b));
}

const handlers = {
  async login(req, res) {
    secure(res);
    if (!adminEnabled()) return fail(res, 503, 'ADMIN_PASSWORD belum diisi (minimal 12 karakter)');
    if (req.headers['x-dev-request'] !== '1') return fail(res, 403, 'Permintaan ditolak');
    const now = Date.now(), ip = req.ip || 'x';
    const f = fails.get(ip) || { n: 0, until: 0 };
    if (now < f.until || now < globalFails.until) return fail(res, 429, 'Terlalu banyak percobaan, coba lagi nanti.');
    const pw = String((req.body && req.body.password) || '');
    if (pw.length > 200 || !safeEqual(pw, adminPassword())) {
      if (++f.n >= 6) { f.until = now + 15 * 60e3; f.n = 0; }
      if (++globalFails.n >= 40) { globalFails = { n: 0, until: now + 10 * 60e3 }; }
      if (fails.size > 2000) fails.clear();
      fails.set(ip, f);
      await new Promise(r => setTimeout(r, 400));
      return fail(res, 401, 'Password salah');
    }
    fails.delete(ip); globalFails.n = 0;
    setCookie(req, res, makeSession(), SESSION_TTL);
    ok(res, {});
  },
  logout(req, res) { setCookie(req, res, '', 0); ok(res, {}); },

  async state(req, res) {
    await load(true);
    const categories = await allCategories();
    const items = [];
    for (const e of staticEntries) {
      const p = normPath(e.cleanPath), ov = state.overrides[p] || {};
      items.push({ kind: 'static', path: p, name: ov.name || e.name, desc: ov.desc || e.desc, category: ov.category || e.category,
        originalCategory: e.category, disabled: derived.disabled.has(p), lockedBySettings: !!e.locked, overridden: !!(ov.category || ov.name || ov.desc) });
    }
    const customs = Object.values(state.endpoints).sort((a, b) => a.name.localeCompare(b.name));
    for (const d of customs) {
      items.push({ kind: 'custom', id: d.id, path: d.path, name: d.name, desc: d.desc, category: d.category, type: d.type, disabled: derived.disabled.has(d.path) });
    }
    const lockedCategories = state.disabledCategories;
    ok(res, { categories, lockedCategories, items, customs, aiModels: require('../../plugin/lib/llm').MODELS, customLimit: MAX_ENDPOINTS });
  },

  async saveEndpoint(req, res) {
    await load(true);
    const b = req.body || {};
    const isEdit = !!b.id;
    if (isEdit && !state.endpoints[b.id]) return fail(res, 404, 'Endpoint tidak ditemukan');
    if (!isEdit && Object.keys(state.endpoints).length >= MAX_ENDPOINTS) return fail(res, 400, `Batas ${MAX_ENDPOINTS} endpoint custom tercapai`);
    const id = isEdit ? b.id : 'e' + crypto.randomBytes(5).toString('hex');
    const def = runner.validateEndpoint(b, {
      selfId: id, staticPaths, endpoints: state.endpoints,
      knownCategories: await allCategories(), aiModels: require('../../plugin/lib/llm').MODELS
    });
    const now = new Date().toISOString();
    def.createdAt = isEdit ? state.endpoints[id].createdAt : now;
    def.updatedAt = now;
    await mutate(s => {
      const old = isEdit ? s.endpoints[id] : null;
      if (old && old.path !== def.path) s.disabledPaths = s.disabledPaths.filter(x => x !== old.path); // path berubah: status mati ikut dibersihkan
      s.endpoints[id] = def;
    });
    ok(res, { endpoint: def });
  },

  async testEndpoint(req, res) {
    const b = req.body || {};
    const d = Object.assign({ name: 'tes', desc: 'tes', category: 'Tes', path: '/api/custom/tes' }, b.def || {});
    for (const k of ['name', 'desc', 'category', 'path']) if (!String(d[k] || '').trim()) d[k] = { name: 'tes', desc: 'tes', category: 'Tes', path: '/api/custom/tes' }[k];
    const def = runner.validateEndpoint(d, { selfId: 'test', staticPaths: new Set(), endpoints: {}, knownCategories: [], aiModels: require('../../plugin/lib/llm').MODELS });
    const out = await runner.runEndpoint(def, b.query && typeof b.query === 'object' ? b.query : {});
    if (out.kind === 'json') return ok(res, { kind: 'json', result: out.json });
    if (out.kind === 'text') return ok(res, { kind: 'text', result: out.text.slice(0, 5000) });
    const small = out.buffer.length <= 900 * 1024 && /^image\/(png|jpeg|webp|gif)$/.test(out.contentType);
    ok(res, { kind: 'file', contentType: out.contentType, size: out.buffer.length, dataUrl: small ? `data:${out.contentType};base64,${out.buffer.toString('base64')}` : null });
  },

  async deleteEndpoint(req, res) {
    await load(true);
    const id = String((req.body && req.body.id) || '');
    const d = state.endpoints[id];
    if (!d) return fail(res, 404, 'Endpoint tidak ditemukan');
    await mutate(s => { delete s.endpoints[id]; s.disabledPaths = s.disabledPaths.filter(x => x !== d.path); });
    ok(res, {});
  },

  async toggle(req, res) {
    await load(true);
    const p = normPath(req.body && req.body.path);
    const disabled = !!(req.body && req.body.disabled);
    if (!staticPaths.has(p) && !derived.dynByPath.has(p)) return fail(res, 404, 'Endpoint tidak ditemukan');
    await mutate(s => {
      const set = new Set(s.disabledPaths);
      if (disabled) set.add(p); else set.delete(p);
      s.disabledPaths = [...set];
    });
    ok(res, { path: p, disabled });
  },

  async categoryLock(req, res) {
    await load(true);
    const name = String((req.body && req.body.category) || '').trim();
    const locked = !!(req.body && req.body.locked);
    const known = (await allCategories()).find(c => lc(c) === lc(name));
    if (!known) return fail(res, 404, 'Kategori tidak ditemukan');
    await mutate(s => {
      const set = new Set(s.disabledCategories.filter(c => lc(c) !== lc(known)));
      if (locked) set.add(known);
      s.disabledCategories = [...set];
    });
    ok(res, { category: known, locked });
  },

  async override(req, res) {
    await load(true);
    const b = req.body || {};
    const p = normPath(b.path);
    if (!staticPaths.has(p)) return fail(res, 404, 'Hanya untuk endpoint bawaan');
    if (b.reset) { await mutate(s => { delete s.overrides[p]; }); return ok(res, {}); }
    const ov = {};
    if (b.category != null && String(b.category).trim()) {
      let c = String(b.category).trim().replace(/^tools\s*-\s*/i, '');
      if (c.length > 40 || !/^[\p{L}\p{N} _&.+-]+$/u.test(c)) return fail(res, 400, 'Nama kategori tidak valid');
      c = (await allCategories()).find(x => lc(x) === lc(c)) || c;
      ov.category = c;
    }
    if (b.name != null && String(b.name).trim()) ov.name = String(b.name).trim().slice(0, 60);
    if (b.desc != null && String(b.desc).trim()) ov.desc = String(b.desc).trim().slice(0, 400);
    await mutate(s => { if (Object.keys(ov).length) s.overrides[p] = ov; else delete s.overrides[p]; });
    ok(res, { override: ov });
  },

  async categoryRename(req, res) {
    await load(true);
    const from = String((req.body && req.body.from) || '').trim();
    let to = String((req.body && req.body.to) || '').trim().replace(/^tools\s*-\s*/i, '');
    if (!to || to.length > 40 || !/^[\p{L}\p{N} _&.+-]+$/u.test(to)) return fail(res, 400, 'Nama kategori baru tidak valid');
    const cur = (await allCategories()).find(c => lc(c) === lc(from));
    if (!cur) return fail(res, 404, 'Kategori asal tidak ditemukan');
    to = (await allCategories()).find(c => lc(c) === lc(to) && lc(c) !== lc(cur)) || to;
    let moved = 0;
    await mutate(s => {
      for (const e of staticEntries) {
        const p = normPath(e.cleanPath), ov = s.overrides[p] || {};
        if (lc(ov.category || e.category) === lc(cur)) { s.overrides[p] = Object.assign(ov, { category: to }); moved++; }
      }
      for (const d of Object.values(s.endpoints)) if (lc(d.category) === lc(cur)) { d.category = to; moved++; }
      s.disabledCategories = s.disabledCategories.map(c => (lc(c) === lc(cur) ? to : c));
    });
    ok(res, { moved, to });
  },

  async users(req, res) {
    const q = lc(req.query.q).trim();
    const only = String(req.query.filter || 'all');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1), per = 30;
    const all = await store.listUsers();
    const bannedTotal = all.filter(u => u.banned).length;
    let rows = all.filter(u => (only !== 'banned' || u.banned) &&
      (!q || [u.name, u.email, u.sub, u.apikey].some(v => lc(v).includes(q))));
    rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    const total = rows.length;
    rows = rows.slice((page - 1) * per, page * per);
    const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const used = await store.getUsageMany(rows.map(u => u.sub), day);
    ok(res, {
      total, bannedTotal, allTotal: all.length, page, per,
      users: rows.map((u, i) => ({
        sub: u.sub, name: u.name, email: u.email,
        provider: String(u.sub).startsWith('local:') ? 'manual' : 'google',
        createdAt: u.createdAt || null, lastLogin: u.lastLogin || null, usedToday: used[i],
        key: u.apikey ? u.apikey.slice(0, 8) + '…' + u.apikey.slice(-5) : '',
        banned: u.banned || null
      }))
    });
  },

  async ban(req, res) {
    const b = req.body || {};
    const sub = String(b.sub || '');
    const user = sub ? await store.getUserBySub(sub) : null;
    if (!user) return fail(res, 404, 'User tidak ditemukan');
    if (b.banned) user.banned = { at: new Date().toISOString(), reason: String(b.reason || '').trim().slice(0, 200) || 'Melanggar aturan' };
    else delete user.banned;
    await store.saveUser(user);
    auth.forgetKey(user.apikey);
    ok(res, { sub: user.sub, banned: user.banned || null });
  },

  info(req, res) {
    const env = n => !!String(process.env[n] || '').trim();
    const llmKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'MISTRAL_API_KEY', 'DEEPSEEK_API_KEY', 'OPENROUTER_API_KEY', 'POLLINATIONS_API_KEY'];
    ok(res, {
      storage: store.mode, vercel: !!process.env.VERCEL,
      persistent: store.mode === 'redis',
      providers: Object.fromEntries(llmKeys.map(k => [k.replace('_API_KEY', ''), env(k)])),
      smtp: env('SMTP_HOST') || env('BREVO_API_KEY'),
      node: process.version, uptimeSec: Math.round(process.uptime()),
      staticEndpoints: staticEntries.length, customEndpoints: Object.keys(state ? state.endpoints : {}).length
    });
  }
};

function createRouter() {
  const express = require('express');
  const rateLimit = require('express-rate-limit');
  const r = express.Router();
  const limiter = rateLimit({
    windowMs: 60000, max: 180, standardHeaders: true, legacyHeaders: false, validate: { trustProxy: false },
    message: { status: false, error: 'Terlalu banyak permintaan' }
  });
  const wrap = fn => (req, res) => Promise.resolve(fn(req, res)).catch(e => {
    if (e instanceof DevError) return fail(res, e.status, e.message);
    console.error('[dev-api]', e.message);
    if (!res.headersSent) fail(res, 500, 'Terjadi kesalahan server');
  });
  r.get('/dev', page);
  r.post('/dev-api/login', limiter, wrap(handlers.login));
  r.use('/dev-api', limiter, requireAdmin);
  r.post('/dev-api/logout', wrap(handlers.logout));
  r.get('/dev-api/state', wrap(handlers.state));
  r.get('/dev-api/info', wrap(handlers.info));
  r.get('/dev-api/users', wrap(handlers.users));
  r.post('/dev-api/endpoint', wrap(handlers.saveEndpoint));
  r.post('/dev-api/endpoint/test', wrap(handlers.testEndpoint));
  r.post('/dev-api/endpoint/delete', wrap(handlers.deleteEndpoint));
  r.post('/dev-api/toggle', wrap(handlers.toggle));
  r.post('/dev-api/category-lock', wrap(handlers.categoryLock));
  r.post('/dev-api/category-rename', wrap(handlers.categoryRename));
  r.post('/dev-api/override', wrap(handlers.override));
  r.post('/dev-api/ban', wrap(handlers.ban));
  return r;
}

module.exports = { createRouter, guard, dynamic, listing, registerStatic, load, cacheCategory, handlers, _reset: () => { state = null; loadedAt = 0; staticEntries = []; staticPaths.clear(); staticByPath.clear(); } };
