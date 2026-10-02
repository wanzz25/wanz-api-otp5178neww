const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const BASE_URL = "https://y2mate.gs";
const MAX_TOTAL_TIME = 30000;
const POLL_LIMIT = 20;
const POLL_DELAY = 800;

function cleanText(text) {
  return String(text || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function compactAvailable(links) {
  const result = {};

  for (const [type, group] of Object.entries(links || {})) {
    for (const [id, item] of Object.entries(group || {})) {
      const format = item.f || type;
      let quality = item.q || id;

      if (id.includes("@")) {
        quality = id;
      }

      if (format === "m4a" && quality === ".m4a") {
        quality = cleanText(item.q_text).replace(".m4a", "").replace(/[()]/g, "").trim() || "256kbps";
      }

      if (!result[format]) result[format] = [];
      if (!result[format].includes(quality)) result[format].push(quality);
    }
  }

  return result;
}

function extractQualityNumber(q) {
  const match = String(q || "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function pickBestEntry(entries) {
  if (!entries.length) return null;
  const scored = entries.map(e => ({ e, score: extractQualityNumber(e.q || e.id) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].e;
}

function pickFormat(links, type, quality) {
  const group = links?.[type];
  if (!group) return null;

  const entries = Object.entries(group).map(([id, data]) => ({
    id,
    ...data
  }));

  if (!quality) return pickBestEntry(entries); // auto: kualitas terbaik

  return entries.find(v => v.q === quality || v.id === quality || v.f === type && v.q === quality) || pickBestEntry(entries);
}

function findDownloadUrl(data) {
  if (!data) return null;

  if (typeof data === "string") {
    const match = data.match(/https?:\/\/[^\s"'<>]+/i);
    return match ? match[0].replace(/\\\//g, "/") : null;
  }

  if (typeof data !== "object") return null;

  const keys = ["dlink", "download", "download_url", "url", "link", "result", "result_url", "file", "href"];

  for (const key of keys) {
    if (typeof data[key] === "string" && /^https?:\/\//i.test(data[key])) {
      return data[key].replace(/\\\//g, "/");
    }
  }

  for (const value of Object.values(data)) {
    const found = findDownloadUrl(value);
    if (found) return found;
  }

  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadY2mate(inputUrl, type = "mp3", quality) {
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;
  const timeoutReached = () => elapsed() >= MAX_TOTAL_TIME;

  const jar = new CookieJar();
  if (process.env.CF_CLEARANCE) {
    await jar.setCookie(`cf_clearance=${process.env.CF_CLEARANCE}`, BASE_URL);
  }

  const api = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 20000,
    validateStatus: () => true,
    headers: {
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "origin": BASE_URL,
      "referer": `${BASE_URL}/`,
      "x-requested-with": "XMLHttpRequest",
      "sec-ch-ua": `"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`
    }
  }));

  async function analyze(url) {
    if (timeoutReached()) throw new Error("Timeout sebelum analyze");

    await api.get(`${BASE_URL}/`, {
      timeout: 15000,
      headers: { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }
    });

    if (timeoutReached()) throw new Error("Timeout setelah load home");

    const body = new URLSearchParams({ k_query: url, k_page: "home", hl: "en", q_auto: "0" });

    const res = await api.post(`${BASE_URL}/mates/analyzeV2/ajax`, body.toString(), {
      timeout: 20000,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
    });

    return { code: res.status, data: res.data };
  }

  async function convert(vid, k) {
    if (timeoutReached()) throw new Error("Timeout sebelum convert");

    const body = new URLSearchParams({ vid, k });

    const res = await api.post(`${BASE_URL}/mates/convertV2/index`, body.toString(), {
      timeout: 20000,
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
    });

    return { code: res.status, data: res.data };
  }

  async function poll(bId) {
    for (let i = 0; i < POLL_LIMIT; i++) {
      if (timeoutReached()) break;

      const body = new URLSearchParams({ b_id: bId });

      const res = await api.post(`${BASE_URL}/mates/convertV2/pool`, body.toString(), {
        timeout: 10000,
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
      });

      const url = findDownloadUrl(res.data);

      if (url) return { code: res.status, data: res.data, url };

      if (res.data?.c_status === "FAILED" || res.data?.status === "error") {
        return { code: res.status, data: res.data, url: null };
      }

      if (timeoutReached()) break;

      await sleep(POLL_DELAY);
    }

    return null;
  }

  const analyzed = await analyze(inputUrl);

  if (analyzed.code !== 200 || analyzed.data?.status !== "ok") {
    return {
      status: false,
      code: analyzed.code,
      input: inputUrl,
      result_url: null,
      time_ms: elapsed(),
      error: analyzed.data
    };
  }

  const detail = analyzed.data;
  const selected = pickFormat(detail.links, type, quality);

  if (!selected?.k) {
    return {
      status: false,
      code: 404,
      input: inputUrl,
      type,
      quality,
      result_url: null,
      time_ms: elapsed(),
      available: compactAvailable(detail.links),
      error: `Format ${type} ${quality} tidak ditemukan`
    };
  }

  const converted = await convert(detail.vid, selected.k);
  let resultUrl = findDownloadUrl(converted.data);
  let pollRaw = null;

  if (!resultUrl && converted.data?.b_id && !timeoutReached()) {
    const pooled = await poll(converted.data.b_id);
    resultUrl = pooled?.url || null;
    pollRaw = pooled?.data || null;
  }

  const output = {
    status: Boolean(resultUrl),
    code: converted.code,
    input: inputUrl,
    title: detail.title || null,
    vid: detail.vid || null,
    duration: detail.t || null,
    extractor: detail.extractor || null,
    type,
    quality: selected.q || quality,
    format: selected.f || null,
    size: selected.size || null,
    result_url: resultUrl,
    time_ms: elapsed(),
    available: compactAvailable(detail.links)
  };

  if (!resultUrl) {
    output.error = timeoutReached() ? "Timeout: proses dihentikan sebelum 60 detik" : "Result_url tidak ditemukan";
  }

  return output;
}

module.exports = {
  name: "Youtube Downloader (y2mate.gs) [EXPERIMENTAL]",
  desc: "Download audio/video Youtube via y2mate.gs. EKSPERIMENTAL — endpoint API ditebak dari pola situs y2mate sejenis, belum terverifikasi jalan. Kualitas otomatis pilih terbaik.",
  category: "Downloader",
  path: "/api/download/ytmp3gs?apikey=&url=&type=",
  async run(req, res) {
    const { url, apikey, type, quality } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const result = await downloadY2mate(url, type || "mp3", quality || undefined);
      return res.status(result.status ? 200 : 400).json({
        status: result.status,
        result
      });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || error });
    }
  }
};
