'use strict';
// Membuat plugin-manifest.json. Jalankan: npm run manifest (otomatis juga saat build di Vercel).
// --stub-missing: modul yang belum terpasang diganti stub kosong (hanya untuk mengambil metadata).
const fs = require('fs');
const path = require('path');
const Module = require('module');
const lib = require('../core/manifest');

if (process.argv.includes('--stub-missing')) {
  const stub = new Proxy(function () {}, {
    get: (t, p) => (p === 'then' || p === Symbol.toPrimitive ? undefined : stub),
    apply: () => stub, construct: () => stub
  });
  const orig = Module._load;
  Module._load = function (request) {
    try { return orig.apply(this, arguments); }
    catch (e) {
      if (e && e.code === 'MODULE_NOT_FOUND' && !request.startsWith('.') && !request.startsWith('/')) return stub;
      throw e;
    }
  };
}

const dir = path.join(__dirname, '..', 'plugin');
const routes = [], eager = [];
for (const file of lib.pluginFiles(dir)) {
  try {
    const m = require(path.join(dir, file));
    const list = Array.isArray(m) ? m : [m];
    let added = 0;
    list.forEach((r, idx) => {
      if (r && r.name && r.desc && r.category && r.path && typeof r.run === 'function') {
        routes.push({ file, idx, name: r.name, desc: r.desc, category: r.category, path: r.path });
        added++;
      }
    });
    if (!added) eager.push(file);
  } catch (e) {
    eager.push(file); // gagal dimuat saat build: biarkan dimuat penuh saat runtime seperti biasa
    console.warn('[manifest] dimuat penuh saat runtime:', file, '-', e.message);
  }
}
fs.writeFileSync(lib.MANIFEST, JSON.stringify({ v: 1, sig: lib.signature(dir), routes, eager }));
console.log(`[manifest] ${routes.length} route, ${eager.length} file dimuat penuh -> ${path.basename(lib.MANIFEST)}`);
