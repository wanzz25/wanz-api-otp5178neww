'use strict';
// Cache respons JSON di memori (per instance) untuk kategori tertentu. Dipasang SETELAH apiGate,
// jadi kuota tetap terhitung dan apikey tetap dicek; yang dihemat adalah waktu menunggu sumber data.
const settings = require('../settings');

const MAX_ENTRIES = 400;
const MAX_BYTES = 256 * 1024;
const mem = new Map();

const ttlTable = () => {
  const t = new Map();
  for (const [k, v] of Object.entries(settings.cacheTtl || {})) if (Number(v) > 0) t.set(k.toLowerCase(), Number(v));
  return t;
};

function middleware(categoryOf) {
  const ttls = ttlTable();
  return (req, res, next) => {
    if (req.method !== 'GET' || !req.path.startsWith('/api/') || !ttls.size) return next();
    const p = req.path.toLowerCase().replace(/\/+$/, '');
    const cat = categoryOf(p);
    const ttl = cat ? ttls.get(String(cat).toLowerCase()) : 0;
    if (!ttl) return next();

    const q = Object.keys(req.query).filter(k => k !== 'apikey').sort().map(k => k + '=' + JSON.stringify(req.query[k])).join('&');
    const key = p + '?' + q;
    const hit = mem.get(key);
    if (hit && hit.exp > Date.now()) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).type('application/json').send(hit.body);
    }
    res.setHeader('X-Cache', 'MISS');
    const send = res.send;
    res.send = function (body) {
      if (typeof body === 'string' && res.statusCode === 200 && body.length <= MAX_BYTES &&
          /json/.test(String(res.get('Content-Type') || '')) && /"status":\s*true/.test(body)) {
        if (mem.size >= MAX_ENTRIES) mem.delete(mem.keys().next().value);
        mem.set(key, { body, exp: Date.now() + ttl * 1000 });
      }
      return send.call(this, body);
    };
    next();
  };
}

module.exports = { middleware, _mem: mem };
