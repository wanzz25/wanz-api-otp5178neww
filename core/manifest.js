'use strict';
// Manifest plugin: metadata route disimpan di plugin-manifest.json, jadi server tidak perlu memuat
// ratusan file plugin (dan modul berat seperti canvas) saat start. Plugin baru dimuat saat endpoint pertama kali dipanggil.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST = path.join(__dirname, '..', 'plugin-manifest.json');

function pluginFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.js') && fs.statSync(path.join(dir, f)).isFile()).sort();
}
// Tanda tangan isi semua plugin: kalau ada plugin berubah/ditambah, manifest dianggap usang
function signature(dir) {
  const h = crypto.createHash('sha1');
  for (const f of pluginFiles(dir)) h.update(f + '\0').update(fs.readFileSync(path.join(dir, f))).update('\0');
  return h.digest('hex');
}

function load(dir) {
  if (String(process.env.LAZY_PLUGINS || 'true').toLowerCase() === 'false') return null;
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    if (m.v !== 1 || !Array.isArray(m.routes)) return null;
    if (m.sig !== signature(dir)) {
      console.warn('[plugin] manifest usang (plugin berubah). Jalankan: npm run manifest. Sementara dimuat penuh.');
      return null;
    }
    return m;
  } catch (_) { return null; }
}

// Handler yang baru memuat file plugin saat pertama kali dipakai
function lazyRun(full, idx) {
  let fn = null;
  return (req, res, next) => {
    try {
      if (!fn) {
        const m = require(full);
        fn = (Array.isArray(m) ? m : [m])[idx].run;
      }
      return fn(req, res, next);
    } catch (e) {
      console.error('[plugin] gagal memuat', path.basename(full), e.message);
      if (!res.headersSent) res.status(500).json({ status: false, error: 'Endpoint gagal dimuat' });
    }
  };
}

module.exports = { MANIFEST, pluginFiles, signature, load, lazyRun };
