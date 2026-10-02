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

function cleanText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value, limit = 700) {
  const text = cleanText(value);
  if (!limit || text.length <= limit) return text;
  return text.slice(0, limit).trim() + "...";
}

function getImagesFromHtml(html) {
  const found = [];
  const text = String(html || "");
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

function getVideosFromHtml(html) {
  const found = [];
  const text = String(html || "");
  const regex = /<iframe[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

function cleanHighlight(value) {
  if (!Array.isArray(value)) return [];
  return value.map(x => limitText(x, 250)).filter(Boolean);
}

function compactSearchItem(item) {
  return {
    id: item.id ?? null,
    title: item.title ?? null,
    slug: item.slug ?? null,
    url: item.slug ? `https://mcpedl.com/${item.slug}/` : null,
    source: item.source ?? null,
    score: item.score ?? null,
    summary: limitText(item.summary, 300),
    description: limitText(item.description),
    image: item.image ?? null,
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
    downloads_count: item.downloadCount ?? null,
    rating: item.average_rating ?? null,
    type_id: item.type_id ?? null,
    author: {
      name: item.display_name ?? null,
      username: item.user_nicename ?? null,
      id: item.user_id ?? null,
      avatar: item.user_avatar ?? null
    },
    tags: Array.isArray(item.cf_tags) ? item.cf_tags.map(tag => ({ id: tag.id ?? null, name: tag.name ?? null, slug: tag.slug ?? null, url: tag.url ?? null })) : [],
    highlight: {
      title: cleanHighlight(item.highlight?.title),
      description: cleanHighlight(item.highlight?.description)
    }
  };
}

function compactDetail(data) {
  const d = data?.data || data || {};
  const htmlImages = getImagesFromHtml(d.description);
  const htmlVideos = getVideosFromHtml(d.description);
  const images = Array.isArray(d.submission_images) && d.submission_images.length ? d.submission_images : htmlImages;
  const videos = Array.isArray(d.submission_videos) && d.submission_videos.length ? d.submission_videos : htmlVideos;

  return {
    id: d.id ?? null,
    submission_id: d.submission_id ?? null,
    title: d.title ?? null,
    slug: d.slug ?? null,
    url: d.slug ? `https://mcpedl.com/${d.slug}/` : null,
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
    categories: Array.isArray(d.categories) ? d.categories.map(x => ({ id: x.id ?? null, name: x.name ?? null, slug: x.slug ?? null })) : [],
    tags: Array.isArray(d.cf_tags) ? d.cf_tags.map(x => ({ id: x.id ?? null, name: x.name ?? null, slug: x.slug ?? null, url: x.url ?? null })) : [],
    images,
    videos,
    downloads: Array.isArray(d.downloads) ? d.downloads.map(x => ({ id: x.id ?? null, name: x.display_name || x.name || null, url: x.url || x.download_url || x.file || null, type: x.type ?? null, file_date: x.fileDate ?? null })) : [],
    revisions: Array.isArray(d.revisions) ? d.revisions.map(x => ({ id: x.id ?? null, version: x.version ?? null, changelog: limitText(x.changelog, 350) })) : [],
    related: Array.isArray(d.related) ? d.related.slice(0, 8).map(x => ({ id: x.id ?? null, title: x.title ?? null, slug: x.slug ?? null, url: x.slug ? `https://mcpedl.com/${x.slug}/` : null, image: x.image ?? null })) : [],
    comments: Array.isArray(d.comments) ? d.comments.slice(0, 8).map(x => ({ id: x.id ?? null, author: x.author || x.user?.display_name || null, text: limitText(x.text, 250), likes: x.likes_count ?? null, created_at: x.created_at ?? null })) : []
  };
}

async function searchAdvanced(query, page, sort, updatedAt) {
  const res = await api.get("/api/search/advanced", {
    params: { q: query, sort, updated_at: updatedAt, page }
  });

  if (res.status < 200 || res.status >= 300) {
    return { ok: false, code: res.status, page, meta: null, results: [], error: typeof res.data === "string" ? res.data.slice(0, 300) : res.data };
  }

  return { ok: true, code: res.status, page, meta: res.data?.meta || null, results: Array.isArray(res.data?.results) ? res.data.results : [] };
}

async function getDetail(slug, detailFull) {
  const res = await api.get(`/api/route/slug/${encodeURIComponent(slug)}`);

  if (res.status < 200 || res.status >= 300 || !res.data?.data) {
    return { ok: false, code: res.status, slug, error: typeof res.data === "string" ? res.data.slice(0, 300) : res.data };
  }

  return { ok: true, code: res.status, slug, data: detailFull ? res.data.data : compactDetail(res.data) };
}

async function searchMcpedl({ query, page = 1, sort = "relevance", updatedAt = "2y", withDetail = false, detailFull = false }) {
  const search = await searchAdvanced(query, page, sort, updatedAt);
  const results = [];

  for (const item of search.results) {
    const slug = item.slug;
    if (!slug) continue;

    if (!withDetail) {
      results.push({ search: compactSearchItem(item), detail: null });
      continue;
    }

    const detail = await getDetail(slug, detailFull);
    results.push({
      search: compactSearchItem(item),
      detail: detail.ok ? detail.data : null,
      detail_error: detail.ok ? null : { code: detail.code, error: detail.error }
    });
  }

  return {
    code: search.code,
    page,
    meta: search.meta,
    total: results.length,
    results
  };
}

module.exports = {
  name: "MCPEDL Search",
  desc: "Cari addon/shader/map di MCPEDL cukup masukin judul/keyword-nya aja, sisanya opsional.",
  category: "Tools",
  path: "/api/mcpedl/search?apikey=&q=",
  async run(req, res) {
    const { apikey, q, page, sort, updated_at, detail, detail_full } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!q) {
      return res.status(400).json({ status: false, error: "Parameter 'q' (keyword pencarian) wajib diisi" });
    }

    try {
      const result = await searchMcpedl({
        query: q,
        page: Number(page) > 0 ? Number(page) : 1,
        sort: sort || "relevance",
        updatedAt: updated_at || "2y",
        withDetail: detail === "true" || detail === "1",
        detailFull: detail_full === "true" || detail_full === "1"
      });

      return res.status(200).json({ status: true, result });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || error });
    }
  }
};
