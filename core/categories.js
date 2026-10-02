'use strict';
// Normalisasi kategori + penguncian kategori (mis. AI).
// Atur kategori terkunci lewat settings.js (lockedCategories) atau env LOCKED_CATEGORIES="AI,Fun".
// Kosongkan (LOCKED_CATEGORIES=) untuk membuka semua kunci.

// Nama kategori tanpa awalan "Tools -": "Tools - Encoding" -> "Encoding". "Tools" polos tetap "Tools".
const normalizeCategory = c => {
  const s = String(c || '').trim();
  const m = s.match(/^tools\s*-\s*(.+)$/i);
  return m ? m[1].trim() : s;
};

function getLockedSet(settings) {
  const raw = process.env.LOCKED_CATEGORIES !== undefined
    ? process.env.LOCKED_CATEGORIES.split(',')
    : (settings.lockedCategories || []);
  return new Set(raw.map(s => normalizeCategory(s).toLowerCase()).filter(Boolean));
}

const isLocked = (category, lockedSet) => lockedSet.has(normalizeCategory(category).toLowerCase());
const lockedLabel = category => `${category} (Terkunci)`;

// Middleware: tolak request ke endpoint terkunci sebelum apikey/limit dihitung
function createLockGuard(lockedPaths, lockedSet) {
  const aiLocked = lockedSet.has('ai');
  return (req, res, next) => {
    const p = req.path.toLowerCase().replace(/\/+$/, '');
    if (lockedPaths.has(p) || (aiLocked && p.startsWith('/api/ai/'))) {
      return res.status(403).json({ status: false, locked: true, error: 'Fitur ini sedang dikunci dan dinonaktifkan oleh admin.' });
    }
    next();
  };
}

module.exports = { normalizeCategory, getLockedSet, isLocked, lockedLabel, createLockGuard };
