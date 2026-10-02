'use strict';
const fs = require('fs');
const path = require('path');

const UP_URL = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').replace(/\/$/, '');
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
const useRedis = !!(UP_URL && UP_TOKEN);

// ---------- Redis (Upstash REST) ----------
async function call(body, pipeline) {
  const axios = require('axios');
  const r = await axios.post(pipeline ? UP_URL + '/pipeline' : UP_URL, body, {
    headers: { Authorization: 'Bearer ' + UP_TOKEN },
    timeout: 8000
  });
  return r.data;
}
async function cmd(...args) {
  const d = await call(args, false);
  if (d.error) throw new Error(d.error);
  return d.result;
}
async function pipe(cmds) {
  const d = await call(cmds, true);
  return d.map(x => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

const redisStore = {
  async getUserBySub(sub) {
    const v = await cmd('GET', 'wanz:user:' + sub);
    return v ? JSON.parse(v) : null;
  },
  async getUserByKey(key) {
    const sub = await cmd('GET', 'wanz:key:' + key);
    return sub ? redisStore.getUserBySub(sub) : null;
  },
  async getUserByEmail(email) {
    const sub = await cmd('GET', 'wanz:email:' + email.toLowerCase());
    return sub ? redisStore.getUserBySub(sub) : null;
  },
  async saveUser(user) {
    const cmds = [
      ['SET', 'wanz:user:' + user.sub, JSON.stringify(user)],
      ['SET', 'wanz:key:' + user.apikey, user.sub]
    ];
    if (user.email) cmds.push(['SETNX', 'wanz:email:' + user.email.toLowerCase(), user.sub]);
    await pipe(cmds);
  },
  async rotateKey(user, newKey) {
    const old = user.apikey;
    user.apikey = newKey;
    await pipe([
      ['SET', 'wanz:user:' + user.sub, JSON.stringify(user)],
      ['SET', 'wanz:key:' + newKey, user.sub],
      ['DEL', 'wanz:key:' + old]
    ]);
    return user;
  },
  // ---- OTP pendaftaran ----
  async setPending(email, rec, ttl) {
    await pipe([
      ['SET', 'wanz:otp:' + email, JSON.stringify(rec), 'EX', String(ttl)],
      ['DEL', 'wanz:otptry:' + email]
    ]);
  },
  async getPending(email) {
    const v = await cmd('GET', 'wanz:otp:' + email);
    return v ? JSON.parse(v) : null;
  },
  async incrTries(email, ttl) {
    const r = await pipe([['INCR', 'wanz:otptry:' + email], ['EXPIRE', 'wanz:otptry:' + email, String(ttl)]]);
    return Number(r[0]);
  },
  async delPending(email) {
    await pipe([['DEL', 'wanz:otp:' + email], ['DEL', 'wanz:otptry:' + email]]);
  },
  // ---- config dev page (satu dokumen JSON per nama) ----
  async getConfig(name) {
    const v = await cmd('GET', 'wanz:cfg:' + name);
    return v ? JSON.parse(v) : null;
  },
  async setConfig(name, value) {
    await cmd('SET', 'wanz:cfg:' + name, JSON.stringify(value));
  },
  async listUsers(max = 5000) {
    const out = [];
    let cursor = '0';
    do {
      const r = await cmd('SCAN', cursor, 'MATCH', 'wanz:user:*', 'COUNT', '500');
      cursor = String(r[0]);
      if (r[1].length) {
        const vals = await cmd('MGET', ...r[1]);
        for (const v of vals) { if (v) { try { out.push(JSON.parse(v)); } catch (_) {} } }
      }
    } while (cursor !== '0' && out.length < max);
    return out;
  },
  async getUsageMany(subs, day) {
    if (!subs.length) return [];
    const r = await pipe(subs.map(s => ['GET', `wanz:usage:${s}:${day}`]));
    return r.map(v => Number(v || 0));
  },
  async incrUsage(id, day) {
    const k = `wanz:usage:${id}:${day}`;
    const r = await pipe([['INCR', k], ['EXPIRE', k, 3024000]]);
    return Number(r[0]);
  },
  async getUsage(id, day) {
    return Number((await cmd('GET', `wanz:usage:${id}:${day}`)) || 0);
  },
  async getUsageRange(id, days) {
    const r = await pipe(days.map(d => ['GET', `wanz:usage:${id}:${d}`]));
    return r.map(v => Number(v || 0));
  }
};

// ---------- File JSON ----------
const DB_FILE = process.env.DB_FILE ||
  path.join(process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data'), 'db.json');
let db = { users: {}, keys: {}, usage: {}, emails: {}, pending: {}, cfg: {} };
let timer = null;

function load() {
  try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (_) {}
}
function flushSoon() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    try {
      const minDay = new Date(Date.now() + 7 * 3600e3 - 35 * 86400e3).toISOString().slice(0, 10);
      for (const k of Object.keys(db.usage)) if (k.split('|')[1] < minDay) delete db.usage[k];
      for (const k of Object.keys(db.pending)) if (db.pending[k].exp < Date.now()) delete db.pending[k];
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db));
      fs.renameSync(DB_FILE + '.tmp', DB_FILE);
    } catch (e) { console.error('DB flush gagal:', e.message); }
  }, 1500);
  if (timer.unref) timer.unref();
}

const fileStore = {
  async getUserBySub(sub) { return db.users[sub] || null; },
  async getUserByKey(key) { return db.users[db.keys[key]] || null; },
  async getUserByEmail(email) { return db.users[db.emails[email.toLowerCase()]] || null; },
  async saveUser(user) {
    db.users[user.sub] = user;
    db.keys[user.apikey] = user.sub;
    const e = user.email && user.email.toLowerCase();
    if (e && !db.emails[e]) db.emails[e] = user.sub;
    flushSoon();
  },
  async rotateKey(user, newKey) {
    delete db.keys[user.apikey];
    user.apikey = newKey;
    db.users[user.sub] = user;
    db.keys[newKey] = user.sub;
    flushSoon();
    return user;
  },
  async setPending(email, rec, ttl) {
    db.pending[email] = { rec, exp: Date.now() + ttl * 1000, tries: 0 };
    flushSoon();
  },
  async getPending(email) {
    const e = db.pending[email];
    if (!e) return null;
    if (e.exp < Date.now()) { delete db.pending[email]; return null; }
    return e.rec;
  },
  async incrTries(email) {
    const e = db.pending[email];
    if (!e) return 99;
    e.tries = (e.tries || 0) + 1;
    return e.tries;
  },
  async delPending(email) { delete db.pending[email]; flushSoon(); },
  async getConfig(name) { return db.cfg && db.cfg[name] ? JSON.parse(JSON.stringify(db.cfg[name])) : null; },
  async setConfig(name, value) { if (!db.cfg) db.cfg = {}; db.cfg[name] = value; flushSoon(); },
  async listUsers() { return Object.values(db.users); },
  async getUsageMany(subs, day) { return subs.map(s => db.usage[s + '|' + day] || 0); },
  async incrUsage(id, day) {
    const k = id + '|' + day;
    db.usage[k] = (db.usage[k] || 0) + 1;
    flushSoon();
    return db.usage[k];
  },
  async getUsage(id, day) { return db.usage[id + '|' + day] || 0; },
  async getUsageRange(id, days) { return days.map(d => db.usage[id + '|' + d] || 0); }
};

if (!useRedis) {
  load();
  if (process.env.VERCEL) {
    console.warn('[store] Vercel tanpa Upstash/KV: data akun HILANG tiap redeploy/cold start. Set UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN.');
  }
}

module.exports = Object.assign({ mode: useRedis ? 'redis' : 'file', DB_FILE }, useRedis ? redisStore : fileStore);
