const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
// Env OTP/SMTP dibaca dari .env.otp (tidak menimpa nilai yang sudah ada di .env atau dashboard)
require('dotenv').config({ path: path.join(__dirname, '.env.otp'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '.env.ai'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '.env.admin'), quiet: true });

const settings = require('./settings');
const auth = require('./core/auth');
const cats = require('./core/categories');
const dev = require('./core/dev');
const manifestLib = require('./core/manifest');
const cache = require('./core/cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Header X-Response-Time: lama proses di server (untuk mengukur kecepatan)
app.use((req, res, next) => {
  const t0 = process.hrtime.bigint();
  const wh = res.writeHead;
  res.writeHead = function (...a) {
    if (!res.headersSent) res.setHeader('X-Response-Time', Number((process.hrtime.bigint() - t0) / 1000n) / 1000 + 'ms');
    return wh.apply(this, a);
  };
  next();
});

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  message: {
    creator: settings.creatorName || "wanz ai",
    status: false,
    message: "Terlalu banyak permintaan dari IP Anda, silakan coba lagi nanti."
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});
app.use(limiter);

app.use('/views', express.static(path.join(__dirname, 'views'), { maxAge: '10m' }));

global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1,
        'User-Agent': 'Mozilla/5.0'
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

// Apikey user dicek di auth.apiGate; plugin lama hanya melihat key internal
global.apikey = [auth.INTERNAL_KEY];
global.totalreq = 0;

app.use((req, res, next) => {
  global.totalreq += 1;

  const originalJson = res.json;
  res.json = function (data) {
    if (
      data &&
      typeof data === 'object' &&
      req.path !== '/endpoints' &&
      req.path !== '/set'
    ) {
      return originalJson.call(this, {
        creator: settings.creatorName || "wanz ai",
        ...data
      });
    }
    return originalJson.call(this, data);
  };

  next();
});

app.get('/set', (req, res) => {
  const publicSettings = { ...settings };
  delete publicSettings.apiKeys;
  res.json(publicSettings);
});

app.get('/api/logo-proxy', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.sendFile(path.join(__dirname, 'views', 'logo.png'));
});

// Login Google + gate apikey/limit harian untuk semua /api/*
app.use(auth.createRouter());
// Dev page (/dev) + API admin (/dev-api/*), butuh ADMIN_PASSWORD
app.use(dev.createRouter());
// Kunci kategori (default: AI). Diisi saat plugin dimuat; dicek sebelum apikey/limit.
const lockedCats = cats.getLockedSet(settings);
const lockedPaths = new Set();
app.use(cats.createLockGuard(lockedPaths, lockedCats));
app.use(dev.guard); // endpoint/kategori yang dimatikan lewat dev page
app.use(auth.apiGate);
app.use(cache.middleware(dev.cacheCategory)); // cache respons JSON untuk kategori yang diatur di settings.cacheTtl

let totalRoutes = 0;
let totalLocked = 0;
let rawEndpoints = {};
const pluginFolder = path.join(__dirname, 'plugin');

if (!fs.existsSync(pluginFolder)) {
  fs.mkdirSync(pluginFolder);
}

// Muat plugin: lazy lewat plugin-manifest.json bila masih cocok, selain itu dimuat penuh seperti biasa
const manifest = manifestLib.load(pluginFolder);
const defs = []; // { file, route }
let eagerFiles;
if (manifest) {
  for (const r of manifest.routes) {
    defs.push({ file: r.file, route: { name: r.name, desc: r.desc, category: r.category, path: r.path,
      run: manifestLib.lazyRun(path.join(pluginFolder, r.file), r.idx) } });
  }
  eagerFiles = manifest.eager;
  console.log(`⚡ Lazy-load plugin aktif: ${manifest.routes.length} route dari manifest`);
} else {
  eagerFiles = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));
}
for (const file of eagerFiles) {
  try {
    const routes = require(path.join(pluginFolder, file));
    (Array.isArray(routes) ? routes : [routes]).forEach(route => defs.push({ file, route }));
  } catch (err) {
    console.error(chalk.bgRed.white(` ❌ Error in plugin ${file}: ${err.message}`));
  }
}

defs.forEach(({ file, route }) => {
  const { name, desc, path: routePath, run } = route;
  const category = cats.normalizeCategory(route.category);

  if (name && desc && category && routePath && typeof run === 'function') {
    const cleanPath = routePath.split('?')[0];
    const locked = cats.isLocked(category, lockedCats);
    dev.registerStatic({ name, desc, category, path: routePath, cleanPath, locked });

    if (locked) {
      // Tidak didaftarkan sebagai route aktif; request akan ditolak 403 oleh lock guard
      lockedPaths.add(cleanPath.toLowerCase().replace(/\/+$/, ''));
      totalLocked++;
    } else {
      app.get(cleanPath, run);
      totalRoutes++;
      if (!process.env.VERCEL) console.log(chalk.hex('#ff79c6')(`✔ Loaded Plugin Route: `) + chalk.hex('#f1fa8c')(`${cleanPath} (${file})`));
    }
  } else {
    console.warn(chalk.bgRed.white(` ⚠ Skipped invalid route in ${file}`));
  }
});

app.get('/endpoints', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30, stale-while-revalidate=60');
    const l = await dev.listing(); // gabungan endpoint bawaan + custom + status dari dev page
    res.json({
      total: l.total,
      totalLocked: l.totalLocked,
      totalDisabled: l.totalDisabled,
      totalRequests: global.totalreq,
      endpoints: l.endpoints
    });
  } catch (e) {
    console.error('[endpoints]', e.message);
    res.status(500).json({ status: false, error: 'Gagal memuat daftar endpoint' });
  }
});

app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  } catch (err) {
    res.status(500).send("Gagal memuat halaman utama: " + err.message);
  }
});

app.get('/playground', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views', 'playground.html'));
  } catch (err) {
    res.status(500).send("Gagal memuat halaman playground: " + err.message);
  }
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/dashboard', (req, res) => res.redirect(302, '/profile'));

app.get('/api', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views', 'api.html'));
  } catch (err) {
    res.status(500).send("Gagal memuat halaman API docs: " + err.message);
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    status: true,
    totalRequests: global.totalreq,
    totalEndpoints: totalRoutes,
    uptime: process.uptime()
  });
});

// Endpoint custom dari dev page (setelah semua route bawaan, jadi bawaan selalu menang)
app.use(dev.dynamic);

app.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.bgHex('#ffb86c').black(` 🚀 SERVER IS RUNNING ON PORT ${PORT} `));
  console.log(chalk.bgHex('#50fa7b').black(` 📦 TOTAL ROUTES LOADED: ${totalRoutes} `));
});

module.exports = app;
