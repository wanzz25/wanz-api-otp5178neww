const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { statfsSync, readFileSync } = require("node:fs");
const os = require("node:os");
const https = require("node:https");
const { performance } = require("node:perf_hooks");
const { ensureCached, checkApikey, sendPng } = require("./lib/canvas-common");

const COLORS = {
  bg: "#0c0e11", panel: "#14171b", panelAlt: "#191d22", line: "#262b31", lineSoft: "#1e2227",
  text: "#e6e9ec", textDim: "#8a9199", textFaint: "#767e8a",
  amber: "#c9974f", green: "#6fa578", red: "#b8664f", blue: "#6d8fa8"
};

const FONTS = [
  { family: "Inter", url: "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Regular.woff2", localName: "sysinfo_Inter-Regular.woff2" },
  { family: "Inter-Bold", url: "https://cdn.jsdelivr.net/gh/rsms/inter@v4.0/docs/font-files/Inter-Bold.woff2", localName: "sysinfo_Inter-Bold.woff2" },
  { family: "JetBrainsMono", url: "https://cdn.jsdelivr.net/npm/@fontsource/ibm-plex-mono@latest/files/ibm-plex-mono-latin-400-normal.woff2", localName: "sysinfo_IBMPlexMono-Regular.woff2" }
];

const CANVAS_SIZE = { width: 1080, height: 980 };
let fontSans = "sans-serif";
let fontSansBold = "sans-serif";
let fontMono = "monospace";
let fontsReady = false;

async function prepareFonts() {
  if (fontsReady) return;
  for (const font of FONTS) {
    try {
      const localPath = await ensureCached(font.url, font.localName);
      GlobalFonts.registerFromPath(localPath, font.family);
    } catch (e) {
      console.error("Font gagal dimuat, pakai fallback:", font.family, e.message);
    }
  }
  fontSans = "Inter";
  fontSansBold = "Inter-Bold";
  fontMono = "JetBrainsMono";
  fontsReady = true;
}

function readFileSafe(path) {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

function parseProcMap(raw) {
  const map = {};
  if (!raw) return map;
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return map;
}

function getMemInfo() {
  const map = parseProcMap(readFileSafe("/proc/meminfo"));
  const kb = key => map[key] ? parseInt(map[key]) * 1024 : null;
  const total = kb("MemTotal") ?? os.totalmem();
  const free = kb("MemFree") ?? os.freemem();
  const available = kb("MemAvailable");
  const buffers = kb("Buffers");
  const cached = kb("Cached");
  const swapTotal = kb("SwapTotal") ?? 0;
  const swapFree = kb("SwapFree") ?? 0;
  const used = total - free - (buffers ?? 0) - (cached ?? 0);
  return {
    total, free, available, buffers, cached,
    swapTotal, swapFree, swapUsed: swapTotal - swapFree,
    used: used > 0 ? used : total - free,
    usedPercent: ((total - (available ?? free)) / total) * 100
  };
}

function getCpuInfo() {
  const cpus = os.cpus();
  const raw = readFileSafe("/proc/cpuinfo");
  const blocks = raw ? raw.split("\n\n").filter(Boolean) : [];
  const first = blocks.length ? parseProcMap(blocks[0]) : {};
  return {
    model: cpus.length ? cpus[0].model.trim() : (first["model name"] || "Unknown CPU"),
    cores: cpus.length || parseInt(first["siblings"] || "0"),
    cacheSize: first["cache size"] || null,
    loadavg: os.loadavg()
  };
}

function getDiskInfo(path) {
  try {
    const stats = statfsSync(path);
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    const available = stats.bavail * stats.bsize;
    const used = total - available;
    return { total, free, available, used, usedPercent: (used / total) * 100 };
  } catch {
    return null;
  }
}

function getCgroupLimits() {
  const v2mem = readFileSafe("/sys/fs/cgroup/memory.max");
  const v1mem = readFileSafe("/sys/fs/cgroup/memory/memory.limit_in_bytes");
  const v2cpu = readFileSafe("/sys/fs/cgroup/cpu.max");
  const v1cpuQuota = readFileSafe("/sys/fs/cgroup/cpu/cpu.cfs_quota_us");
  const v1cpuPeriod = readFileSafe("/sys/fs/cgroup/cpu/cpu.cfs_period_us");
  let memLimit = null;
  if (v2mem && v2mem.trim() !== "max") memLimit = parseInt(v2mem.trim());
  else if (v1mem) {
    const val = parseInt(v1mem.trim());
    if (val < Number.MAX_SAFE_INTEGER / 2) memLimit = val;
  }
  let cpuLimit = null;
  if (v2cpu && !v2cpu.trim().startsWith("max")) {
    const [quota, period] = v2cpu.trim().split(" ").map(Number);
    if (quota > 0 && period > 0) cpuLimit = quota / period;
  } else if (v1cpuQuota && v1cpuPeriod) {
    const quota = parseInt(v1cpuQuota.trim());
    const period = parseInt(v1cpuPeriod.trim());
    if (quota > 0 && period > 0) cpuLimit = quota / period;
  }
  return { memLimit, cpuLimit, source: v2mem !== null ? "cgroup v2" : (v1mem !== null ? "cgroup v1" : "unavailable") };
}

function getNetworkInfo() {
  const ifaces = os.networkInterfaces();
  const list = [];
  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const addr of (addrs || [])) {
      if (!addr.internal) list.push({ name, address: addr.address, family: addr.family });
    }
  }
  return list;
}

function timedGet(url) {
  return new Promise(resolve => {
    const start = performance.now();
    let bytes = 0;
    const req = https.get(url, res => {
      res.on("data", chunk => { bytes += chunk.length; });
      res.on("end", () => {
        const seconds = (performance.now() - start) / 1000;
        resolve({ bytes, seconds, mbps: seconds > 0 ? (bytes * 8) / (seconds * 1_000_000) : 0 });
      });
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

function timedPost(url, sizeBytes) {
  return new Promise(resolve => {
    const payload = Buffer.alloc(sizeBytes, "a");
    const start = performance.now();
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", "Content-Length": payload.length }
    }, res => {
      res.on("data", () => {});
      res.on("end", () => {
        const seconds = (performance.now() - start) / 1000;
        resolve({ bytes: payload.length, seconds, mbps: seconds > 0 ? (payload.length * 8) / (seconds * 1_000_000) : 0 });
      });
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
}

async function speedTest() {
  const download = await timedGet("https://speed.cloudflare.com/__down?bytes=10000000");
  const upload = await timedPost("https://speed.cloudflare.com/__up", 3000000);
  return { download, upload };
}

function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return "n/a";
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return gb.toFixed(1) + " GB";
  const mb = bytes / (1024 ** 2);
  return mb.toFixed(0) + " MB";
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

async function collectAll() {
  const mem = getMemInfo();
  const cpu = getCpuInfo();
  const disk = getDiskInfo("/");
  const cgroup = getCgroupLimits();
  const net = getNetworkInfo();
  const speed = await speedTest();
  return { hostname: os.hostname(), platform: os.platform(), release: os.release(), arch: os.arch(), uptime: os.uptime(), mem, cpu, disk, cgroup, net, speed };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPanel(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBar(ctx, x, y, w, percent, color) {
  roundRect(ctx, x, y, w, 12, 3);
  ctx.fillStyle = COLORS.lineSoft;
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.stroke();
  const fillW = Math.max(2, (Math.min(percent, 100) / 100) * w);
  roundRect(ctx, x, y, fillW, 12, 3);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawRow(ctx, x, y, w, label, value, valueColor) {
  ctx.font = `13px ${fontSans}`;
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.font = `13px ${fontMono}`;
  ctx.fillStyle = valueColor || COLORS.text;
  ctx.textAlign = "right";
  ctx.fillText(value, x + w, y);
  ctx.textAlign = "left";
}

function drawCardHeader(ctx, x, y, w, name, status) {
  ctx.font = `15px ${fontSansBold}`;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "left";
  ctx.fillText(name, x, y);
  ctx.font = `11px ${fontMono}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.textAlign = "right";
  ctx.fillText(status, x + w, y);
  ctx.textAlign = "left";
  ctx.strokeStyle = COLORS.lineSoft;
  ctx.beginPath();
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x + w, y + 12);
  ctx.stroke();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line, x, cy);
      line = word + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cy);
}

function computeContentHeight(data) {
  const netRows = Math.min(data.net.length || 1, 4);
  const cardH = Math.max(210, 50 + netRows * 24 + 60);
  return Math.round(40 + 30 + 22 + 25 + 30 + 60 + 24 + 90 + 20 + cardH + 14 + cardH + 20 + 140 + 20 + 40);
}

function drawIconCpu(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
  const s = size; const pad = s * 0.28;
  roundRect(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, 2);
  ctx.stroke();
  const legLen = pad * 0.7; const legs = 4; const step = (s - pad * 2) / (legs + 1);
  for (let i = 1; i <= legs; i++) {
    const px = x + pad + step * i;
    ctx.beginPath(); ctx.moveTo(px, y + pad); ctx.lineTo(px, y + pad - legLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, y + s - pad); ctx.lineTo(px, y + s - pad + legLen); ctx.stroke();
    const py = y + pad + step * i;
    ctx.beginPath(); ctx.moveTo(x + pad, py); ctx.lineTo(x + pad - legLen, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s - pad, py); ctx.lineTo(x + s - pad + legLen, py); ctx.stroke();
  }
  ctx.restore();
}

function drawIconMemory(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
  const s = size; const barY = y + s * 0.28; const barH = s * 0.44;
  roundRect(ctx, x + s * 0.08, barY, s * 0.84, barH, 2);
  ctx.stroke();
  const pins = 4; const pinW = s * 0.06; const gap = (s * 0.84 - pins * pinW) / (pins + 1);
  for (let i = 0; i < pins; i++) {
    const px = x + s * 0.08 + gap * (i + 1) + pinW * i;
    ctx.beginPath(); ctx.moveTo(px, barY + barH); ctx.lineTo(px, barY + barH + s * 0.16); ctx.stroke();
  }
  ctx.restore();
}

function drawIconDisk(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = "round";
  const s = size; const cx = x + s / 2; const rx = s * 0.36; const ryTop = s * 0.14;
  const topY = y + s * 0.24; const bottomY = y + s * 0.76;
  ctx.beginPath(); ctx.ellipse(cx, topY, rx, ryTop, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, bottomY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + rx, topY); ctx.lineTo(cx + rx, bottomY); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, bottomY, rx, ryTop, 0, 0, Math.PI, false); ctx.stroke();
  ctx.restore();
}

function drawIconDownload(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
  const s = size; const cx = x + s / 2;
  ctx.beginPath(); ctx.moveTo(cx, y + s * 0.12); ctx.lineTo(cx, y + s * 0.62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, y + s * 0.4); ctx.lineTo(cx, y + s * 0.66); ctx.lineTo(cx + s * 0.22, y + s * 0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.84); ctx.lineTo(x + s * 0.9, y + s * 0.84); ctx.stroke();
  ctx.restore();
}

async function drawScene(data) {
  const contentHeight = computeContentHeight(data);
  const dpr = 2;
  const canvas = createCanvas(CANVAS_SIZE.width * dpr, contentHeight * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_SIZE.width, contentHeight);

  const marginX = 30;
  const W = CANVAS_SIZE.width;
  let cy = 40;

  ctx.font = `11px ${fontSans}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText("SYSTEM REPORT / RUNTIME PROBE", marginX, cy);
  cy += 30;

  ctx.font = `26px ${fontSansBold}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(data.hostname, marginX, cy);

  ctx.font = `11px ${fontMono}`;
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = "right";
  ctx.fillText(new Date().toISOString().slice(0, 19).replace("T", " "), W - marginX, cy - 20);
  ctx.textAlign = "left";

  cy += 22;
  ctx.font = `13px ${fontMono}`;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(`${data.platform} ${data.release} - ${data.arch} - uptime ${formatUptime(data.uptime)}`, marginX, cy);

  cy += 25;
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(marginX, cy); ctx.lineTo(W - marginX, cy); ctx.stroke();

  cy += 30;
  const noticeH = 60;
  drawPanel(ctx, marginX, cy, W - marginX * 2, noticeH);
  ctx.fillStyle = COLORS.amber;
  ctx.fillRect(marginX, cy, 3, noticeH);
  ctx.font = `10px ${fontMono}`;
  ctx.fillStyle = COLORS.amber;
  ctx.fillText("CATATAN", marginX + 16, cy + 22);
  ctx.font = `12px ${fontSans}`;
  ctx.fillStyle = COLORS.textDim;
  const cgroupNote = data.cgroup.memLimit
    ? `Limit resmi container terdeteksi lewat ${data.cgroup.source}: ${formatBytes(data.cgroup.memLimit)} RAM.`
    : `Limit cgroup tidak terbaca. Nilai memori di bawah kemungkinan nilai host, bukan limit resmi panel.`;
  ctx.fillText(cgroupNote, marginX + 16, cy + 42);

  cy += noticeH + 24;

  const stripGap = 14;
  const stripW = (W - marginX * 2 - stripGap * 3) / 4;
  const stripH = 90;
  const memPct = data.mem.usedPercent.toFixed(1);

  const stats = [
    { label: "CPU CORES", value: String(data.cpu.cores), unit: "threads", caption: `load ${data.cpu.loadavg[0].toFixed(2)}` },
    { label: "MEMORY", value: formatBytes(data.mem.total).split(" ")[0], unit: formatBytes(data.mem.total).split(" ")[1], caption: `${memPct}% used` },
    { label: "DISK", value: data.disk ? formatBytes(data.disk.total).split(" ")[0] : "n/a", unit: data.disk ? formatBytes(data.disk.total).split(" ")[1] : "", caption: data.disk ? `${data.disk.usedPercent.toFixed(0)}% used` : "unavailable" },
    { label: "DOWNLOAD", value: data.speed.download ? data.speed.download.mbps.toFixed(1) : "n/a", unit: data.speed.download ? "Mbps" : "", caption: data.speed.upload ? `up ${data.speed.upload.mbps.toFixed(1)} Mbps` : "upload n/a" }
  ];

  const iconDrawers = [drawIconCpu, drawIconMemory, drawIconDisk, drawIconDownload];
  stats.forEach((s, i) => {
    const x = marginX + i * (stripW + stripGap);
    drawPanel(ctx, x, cy, stripW, stripH);
    iconDrawers[i](ctx, x + stripW - 38, cy + 18, 20, COLORS.textDim);

    ctx.font = `11px ${fontSans}`;
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText(s.label, x + 16, cy + 26);
    ctx.font = `22px ${fontSansBold}`;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(s.value, x + 16, cy + 54);
    const vw = ctx.measureText(s.value).width;
    ctx.font = `13px ${fontSans}`;
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(s.unit, x + 16 + vw + 5, cy + 54);
    ctx.font = `11px ${fontMono}`;
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText(s.caption, x + 16, cy + 74);
  });

  cy += stripH + 20;

  const colGap = 14;
  const colW = (W - marginX * 2 - colGap) / 2;
  const cardH = Math.max(210, 50 + Math.min(data.net.length || 1, 4) * 24 + 60);

  drawPanel(ctx, marginX, cy, colW, cardH);
  drawCardHeader(ctx, marginX + 20, cy + 24, colW - 40, "Processor", "runtime probe");
  let ry = cy + 50;
  drawRow(ctx, marginX + 20, ry, colW - 40, "Model", data.cpu.model.length > 34 ? data.cpu.model.slice(0, 34) + "…" : data.cpu.model); ry += 24;
  drawRow(ctx, marginX + 20, ry, colW - 40, "Cores", String(data.cpu.cores)); ry += 24;
  drawRow(ctx, marginX + 20, ry, colW - 40, "Cache", data.cpu.cacheSize || "n/a"); ry += 24;
  drawRow(ctx, marginX + 20, ry, colW - 40, "Load 1m/5m/15m", data.cpu.loadavg.map(v => v.toFixed(2)).join(" / ")); ry += 30;
  drawBar(ctx, marginX + 20, ry, colW - 40, Math.min(100, (data.cpu.loadavg[0] / data.cpu.cores) * 100), COLORS.blue);
  ctx.font = `11px ${fontMono}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText("load / core ratio", marginX + 20, ry + 27);

  const rightX = marginX + colW + colGap;
  drawPanel(ctx, rightX, cy, colW, cardH);
  drawCardHeader(ctx, rightX + 20, cy + 24, colW - 40, "Memory", "/proc/meminfo");
  ry = cy + 50;
  drawRow(ctx, rightX + 20, ry, colW - 40, "Total", formatBytes(data.mem.total)); ry += 24;
  drawRow(ctx, rightX + 20, ry, colW - 40, "Used", formatBytes(data.mem.used)); ry += 24;
  drawRow(ctx, rightX + 20, ry, colW - 40, "Available", formatBytes(data.mem.available ?? data.mem.free)); ry += 24;
  drawRow(ctx, rightX + 20, ry, colW - 40, "Swap", `${formatBytes(data.mem.swapUsed)} / ${formatBytes(data.mem.swapTotal)}`); ry += 30;
  drawBar(ctx, rightX + 20, ry, colW - 40, data.mem.usedPercent, COLORS.green);
  ctx.font = `11px ${fontMono}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText(`${data.mem.usedPercent.toFixed(1)}% used`, rightX + 20, ry + 27);

  cy += cardH + colGap;

  drawPanel(ctx, marginX, cy, colW, cardH);
  drawCardHeader(ctx, marginX + 20, cy + 24, colW - 40, "Disk", "statfs");
  ry = cy + 50;
  if (data.disk) {
    drawRow(ctx, marginX + 20, ry, colW - 40, "Total", formatBytes(data.disk.total)); ry += 24;
    drawRow(ctx, marginX + 20, ry, colW - 40, "Used", formatBytes(data.disk.used)); ry += 24;
    drawRow(ctx, marginX + 20, ry, colW - 40, "Available", formatBytes(data.disk.available)); ry += 30;
    drawBar(ctx, marginX + 20, ry, colW - 40, data.disk.usedPercent, COLORS.amber);
    ctx.font = `11px ${fontMono}`;
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText(`${data.disk.usedPercent.toFixed(1)}% used`, marginX + 20, ry + 27);
  } else {
    ctx.font = `12px ${fontSans}`;
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText("statfs tidak tersedia di environment ini", marginX + 20, ry);
  }

  drawPanel(ctx, rightX, cy, colW, cardH);
  drawCardHeader(ctx, rightX + 20, cy + 24, colW - 40, "Network", "os.networkInterfaces");
  ry = cy + 50;
  if (data.net.length) {
    data.net.slice(0, 4).forEach(n => {
      let maskedIp = n.address;
      if (n.family === "IPv4" || n.family === 4) {
        const parts = n.address.split(".");
        maskedIp = parts.length === 4 ? `${parts[0]}.${parts[1]}.x.x` : "x.x.x.x";
      } else if (n.family === "IPv6" || n.family === 6) {
        const parts = n.address.split(":");
        maskedIp = parts.length > 2 ? `${parts[0]}:${parts[1]}:xxxx::xxxx` : "xxxx::xxxx";
      }
      drawRow(ctx, rightX + 20, ry, colW - 40, n.name, `${maskedIp} (${n.family})`);
      ry += 24;
    });
  } else {
    ctx.font = `12px ${fontSans}`;
    ctx.fillStyle = COLORS.textFaint;
    ctx.fillText("tidak ada interface eksternal terdeteksi", rightX + 20, ry);
    ry += 24;
  }
  ry += 6;
  const dl = data.speed.download ? data.speed.download.mbps.toFixed(2) + " Mbps" : "gagal";
  const ul = data.speed.upload ? data.speed.upload.mbps.toFixed(2) + " Mbps" : "gagal";
  drawRow(ctx, rightX + 20, ry, colW - 40, "Download speed", dl, COLORS.green); ry += 24;
  drawRow(ctx, rightX + 20, ry, colW - 40, "Upload speed", ul, COLORS.blue);

  cy += cardH + colGap;

  const envH = 140;
  drawPanel(ctx, marginX, cy, W - marginX * 2, envH);
  drawCardHeader(ctx, marginX + 20, cy + 24, W - marginX * 2 - 40, "Konteks Environment", "host vs container");
  const boxW = (W - marginX * 2 - 40 - 30) / 2;
  const boxX1 = marginX + 20;
  const boxX2 = boxX1 + boxW + 30;
  const boxY = cy + 44;
  const boxH = envH - 60;

  roundRect(ctx, boxX1, boxY, boxW, boxH, 5);
  ctx.fillStyle = COLORS.panelAlt; ctx.fill();
  ctx.strokeStyle = COLORS.line; ctx.stroke();
  ctx.font = `10px ${fontMono}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText("HOST / NODE", boxX1 + 14, boxY + 20);
  ctx.font = `12px ${fontSans}`;
  ctx.fillStyle = COLORS.textDim;
  wrapText(ctx, "Nilai mentah dari os module & /proc mencerminkan resource node fisik, belum tentu sama dengan limit resmi.", boxX1 + 14, boxY + 40, boxW - 28, 16);

  roundRect(ctx, boxX2, boxY, boxW, boxH, 5);
  ctx.fillStyle = COLORS.panelAlt; ctx.fill();
  ctx.strokeStyle = COLORS.line; ctx.stroke();
  ctx.font = `10px ${fontMono}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText("CGROUP LIMIT", boxX2 + 14, boxY + 20);
  ctx.font = `12px ${fontSans}`;
  ctx.fillStyle = COLORS.textDim;
  const cgText = data.cgroup.memLimit
    ? `Terbaca via ${data.cgroup.source}: ${formatBytes(data.cgroup.memLimit)} RAM${data.cgroup.cpuLimit ? `, ${data.cgroup.cpuLimit.toFixed(2)} CPU` : ""}. Ini limit resmi container.`
    : "Tidak ada limit cgroup yang bisa dibaca di path standar. Kemungkinan panel membatasi lewat mekanisme lain.";
  wrapText(ctx, cgText, boxX2 + 14, boxY + 40, boxW - 28, 16);

  cy += envH + 20;

  ctx.strokeStyle = COLORS.line;
  ctx.beginPath(); ctx.moveTo(marginX, cy); ctx.lineTo(W - marginX, cy); ctx.stroke();
  ctx.font = `11px ${fontMono}`;
  ctx.fillStyle = COLORS.textFaint;
  ctx.fillText("source: os module + /proc + /sys/fs/cgroup + cloudflare speed test", marginX, cy + 20);

  return canvas.encode("png");
}

module.exports = {
  name: "System Info (Private)",
  desc: "Report card spek & status server real-time (CPU, RAM, disk, network, speed test) — khusus dipakai internal bot/website sendiri.",
  category: "Tools",
  path: "/api/system/info?apikey=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    try {
      await prepareFonts();
      const data = await collectAll();
      const buffer = await drawScene(data);
      sendPng(res, buffer);
    } catch (error) {
      console.error("Systeminfo Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate system info" });
    }
  }
};
