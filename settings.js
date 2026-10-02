module.exports = {
  creatorName: "Wanz",
  apiTitle: "Wanz Api Hub",
  webName: "Wanz Api",
  favicon: "/views/logo.png",
  logoIcon: "⚡",
  logoIconUrl: "/views/logo.png",
  dailyLimit: 500,
  // Kategori yang dikunci (endpoint 403, tampil sebagai "(Terkunci)"). Kosongkan [] untuk membuka.
  lockedCategories: [],
  // Cache respons JSON sukses (detik) per kategori. Header X-Cache: HIT/MISS. 0 atau hapus = tanpa cache.
  cacheTtl: { Primbon: 86400, Info: 60, Finance: 30, Anime: 300 }
};
