const axios = require("axios");

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

const api = axios.create({
  baseURL: "https://api.mcpedl.com",
  timeout: 30000,
  validateStatus: () => true,
  headers: {
    "user-agent": UA,
    "accept": "application/json",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "origin": "https://mcpedl.com",
    "referer": "https://mcpedl.com/"
  }
});

function getSlug(input) {
  const raw = String(input || "").trim();

  try {
    const u = new URL(raw);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || raw;
  } catch {
    return raw
      .replace(/^https?:\/\/(?:www\.)?mcpedl\.com\//i, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .trim();
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value, limit = 900) {
  const text = cleanText(value);
  if (!limit || text.length <= limit) return text;
  return text.slice(0, limit).trim() + "...";
}

function normalizeUrl(url) {
  const text = decodeHtml(String(url || "").trim());

  try {
    return new URL(text, "https://mcpedl.com").toString();
  } catch {
    return null;
  }
}

function extractRemoteUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;

  try {
    const u = new URL(normalized);
    const remote = u.searchParams.get("remoteUrl");
    if (remote) return decodeURIComponent(remote);
    return normalized;
  } catch {
    return normalized;
  }
}

function getFileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const name = decodeURIComponent(u.pathname.split("/").pop());
    return name || "download.bin";
  } catch {
    return "download.bin";
  }
}

function isDirectFile(url) {
  return /\.(mcpack|mcaddon|mcworld|zip|rar|7z|png|jpg|jpeg|webp|gif|apk|json|txt)(\?|#|$)/i.test(url || "");
}

function getLinksFromHtml(html) {
  const links = [];
  const text = String(html || "");
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const href = match[1];
    const label = cleanText(match[2]);
    const url = extractRemoteUrl(href);
    if (!url) continue;

    links.push({ name: label || getFileNameFromUrl(url), url, direct: isDirectFile(url), source: "description" });
  }

  return links;
}

function getImagesFromHtml(html) {
  const found = [];
  const text = String(html || "");
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const url = normalizeUrl(match[1]);
    if (url && !found.includes(url)) found.push(url);
  }

  return found;
}

function getVideosFromHtml(html) {
  const found = [];
  const text = String(html || "");
  const regex = /<iframe[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const url = normalizeUrl(match[1]);
    if (url && !found.includes(url)) found.push(url);
  }

  return found;
}

function uniqueLinks(items) {
  const map = new Map();
  for (const item of items) {
    if (!item?.url) continue;
    if (!map.has(item.url)) map.set(item.url, item);
  }
  return [...map.values()];
}

function buildDownloads(data) {
  const d = data || {};

  const apiDownloads = Array.isArray(d.downloads) ? d.downloads.map(x => {
    const url = x.file || x.url || x.download_url || null;
    return {
      id: x.id ?? null,
      name: x.display_name || x.name || getFileNameFromUrl(url),
      url,
      direct: isDirectFile(url),
      type: x.type ?? null,
      file_date: x.fileDate ?? null,
      source: "api"
    };
  }).filter(x => x.url) : [];

  const htmlDownloads = getLinksFromHtml(d.description).filter(x => {
    const lower = `${x.name} ${x.url}`.toLowerCase();
    return ["download", ".mcpack", ".mcaddon", ".mcworld", ".zip", "link-hub.net", "link-center.net", "direct-link.net", "lootlinks", "loot-link", "linkvertise"]
      .some(k => lower.includes(k));
  });

  const all = uniqueLinks([...apiDownloads, ...htmlDownloads]);

  return {
    all,
    direct: all.filter(x => x.direct),
    external: all.filter(x => !x.direct)
  };
}

function getVersionScore(name) {
  const text = String(name || "");
  const matches = [...text.matchAll(/v?(\d+(?:\.\d+)+|\d+)/gi)];
  if (!matches.length) return 0;

  return Math.max(...matches.map(match => {
    return match[1].split(".").map(Number).reduce((total, num, index) => total + num / Math.pow(100, index), 0);
  }));
}

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/\.[a-z0-9]+(\?|#.*)?$/i, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function getTitleWords(detail = {}) {
  const raw = [detail.title, detail.slug, detail.short_description, detail.username, detail.user?.display_name].filter(Boolean).join(" ");

  const blacklist = new Set(["minecraft", "mcpe", "mcbe", "bedrock", "addon", "addons", "texture", "textures", "pack", "packs", "shader", "shaders", "map", "skin", "download", "official", "edition", "android", "windows", "ios", "support", "supports"]);

  return normalizeName(raw).split(" ").filter(x => x.length >= 3 && !blacklist.has(x));
}

function pickMainDownload(downloads, detail = {}) {
  const direct = Array.isArray(downloads?.direct) ? downloads.direct : [];
  if (!direct.length) return null;

  const titleWords = getTitleWords(detail);

  const scored = direct.map((item, index) => {
    const name = normalizeName(`${item.name || ""} ${item.url || ""}`);
    let score = 0;

    for (const word of titleWords) if (name.includes(word)) score += 12;

    if (name.includes("main")) score += 10;
    if (name.includes("latest")) score += 8;
    if (name.includes("release")) score += 6;
    if (name.includes("merged")) score += 5;
    if (name.includes("universal")) score += 5;
    if (name.includes("all")) score += 3;
    if (name.includes("android")) score += 2;
    if (name.includes("windows")) score += 1;
    if (name.includes("ios")) score += 1;
    if (name.includes("old")) score -= 8;
    if (name.includes("beta")) score -= 4;
    if (name.includes("preview")) score -= 4;
    if (name.includes(".mcpack")) score += 5;
    if (name.includes(".mcaddon")) score += 5;
    if (name.includes(".mcworld")) score += 5;
    if (name.includes(".zip")) score += 2;

    score += getVersionScore(name);
    score -= index / 1000;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item || direct[0];
}

async function getDetail(slug) {
  const res = await api.get(`/api/route/slug/${encodeURIComponent(slug)}`);

  if (res.status < 200 || res.status >= 300 || !res.data?.data) {
    const err = new Error("Gagal mengambil detail dari MCPEDL");
    err.status = res.status;
    err.data = res.data;
    throw err;
  }

  return res.data.data;
}

async function scrapeMcpedl(input) {
  const slug = getSlug(input);
  const d = await getDetail(slug);
  const downloads = buildDownloads(d);
  const mainDownload = pickMainDownload(downloads, d);

  return {
    id: d.id ?? null,
    submission_id: d.submission_id ?? null,
    title: d.title ?? null,
    slug: d.slug ?? slug,
    url: d.slug ? `https://mcpedl.com/${d.slug}/` : `https://mcpedl.com/${slug}/`,
    author: d.username || d.user?.display_name || d.user?.username || null,
    status: d.status ?? null,
    type_id: d.type_id ?? null,
    publish_date: d.publish_date ?? null,
    update_date: d.update_date ?? null,
    rating: d.average_rating ?? d.comments_rating?.average ?? null,
    comments_total: d.comments_total ?? null,
    short_description: limitText(d.short_description, 300),
    description: limitText(d.description),
    changelog: limitText(d.changelog, 500),
    image: d.image ?? null,
    thumbnails: d.thumbnails ?? null,
    images: Array.isArray(d.submission_images) && d.submission_images.length ? d.submission_images : getImagesFromHtml(d.description),
    videos: Array.isArray(d.submission_videos) && d.submission_videos.length ? d.submission_videos : getVideosFromHtml(d.description),
    categories: Array.isArray(d.categories) ? d.categories.map(x => ({ id: x.id ?? null, name: x.name ?? null, slug: x.slug ?? null })) : [],
    tags: Array.isArray(d.cf_tags) ? d.cf_tags.map(x => ({ id: x.id ?? null, name: x.name ?? null, slug: x.slug ?? null, url: x.url ?? null })) : [],
    downloads: {
      total: downloads.all.length,
      direct_total: downloads.direct.length,
      external_total: downloads.external.length,
      main: mainDownload,
      direct: downloads.direct,
      external: downloads.external
    },
    related: Array.isArray(d.related) ? d.related.slice(0, 8).map(x => ({ id: x.id ?? null, title: x.title ?? null, slug: x.slug ?? null, url: x.slug ? `https://mcpedl.com/${x.slug}/` : null, image: x.image ?? null })) : []
  };
}

module.exports = {
  name: "MCPEDL Info & Download Link",
  desc: "Ambil detail addon/shader/map MCPEDL beserta link download (tanpa upload file ke server).",
  category: "Tools",
  path: "/api/mcpedl?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi (URL atau slug MCPEDL)" });
    }

    try {
      const result = await scrapeMcpedl(url);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      return res.status(error.status || 500).json({ status: false, error: error.data || error.message || error });
    }
  }
};
