const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { getFfmpegPath } = require("./lib/ffmpeg");
const execFileAsync = promisify(execFile);

// Video mentahan (flare + strobe, 576x1024, 30fps, ada audio). Teks ditimpa di atasnya.
const TEMPLATE_PATH = path.join(__dirname, "..", "assets", "bratvid3-template.mp4");
const TEMPLATE_SECONDS = 8.6; // durasi template; ganti kalau file template diganti

const W = 576;
const H = 1024;
const FPS = 30;

// Font Impact (sama seperti bratvid2), dicoba berurutan sampai ada yang berhasil.
const FONT_SOURCES = [
  { url: "https://cdn.jsdelivr.net/gh/Napoleon-Fibonacci/assets@main/font/impact.ttf", file: "wanz-bratvid3-impact.ttf" },
  { url: "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/ARIALN.ttf", file: "wanz-bratvid3-arialn.ttf" },
  { url: "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf", file: "wanz-bratvid3-anton.ttf" }
];
const FONT_FAMILY = "BratVid3Font";

let fontReady = false;

async function ensureFont() {
  if (fontReady) return;
  let lastErr = null;
  for (const src of FONT_SOURCES) {
    const fontPath = path.join(os.tmpdir(), src.file);
    try {
      if (!fs.existsSync(fontPath) || fs.statSync(fontPath).size < 10000) {
        const res = await axios.get(src.url, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 15000
        });
        fs.writeFileSync(fontPath, Buffer.from(res.data));
      }
      if (GlobalFonts.registerFromPath(fontPath, FONT_FAMILY)) {
        fontReady = true;
        return;
      }
      fs.rmSync(fontPath, { force: true });
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error("Font gagal dimuat: " + (lastErr ? lastErr.message : "semua sumber gagal"));
}

// ====== Layout teks: rata tengah (horizontal + vertikal), ukuran otomatis pas layar ======
const MARGIN_X = 44;
const MAX_TEXT_H = H * 0.74;
const LINE_PITCH = 0.98; // jarak antar baris (kali ukuran font)

function wrapWords(ctx, words, maxWidth, fontSize) {
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  const lines = [];
  let cur = [];
  for (const w of words) {
    const test = [...cur, w].join(" ");
    if (cur.length && ctx.measureText(test).width > maxWidth) {
      lines.push(cur);
      cur = [w];
    } else {
      cur.push(w);
    }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

function fitsAt(ctx, words, fontSize, maxWidth, maxHeight) {
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  const longest = Math.max(...words.map((w) => ctx.measureText(w).width));
  if (longest > maxWidth) return false;
  const lines = wrapWords(ctx, words, maxWidth, fontSize);
  return lines.length * fontSize * LINE_PITCH <= maxHeight;
}

function findBestFontSize(ctx, words, maxWidth, maxHeight) {
  let lo = 12;
  let hi = 300;
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fitsAt(ctx, words, mid, maxWidth, maxHeight)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function buildLayout(ctx, words) {
  const maxWidth = W - MARGIN_X * 2;
  const fontSize = findBestFontSize(ctx, words, maxWidth, MAX_TEXT_H);
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;

  const spaceW = ctx.measureText(" ").width;
  const capH = ctx.measureText("H").actualBoundingBoxAscent || fontSize * 0.72;
  const lines = wrapWords(ctx, words, maxWidth, fontSize);
  const pitch = fontSize * LINE_PITCH;
  const top = (H - lines.length * pitch) / 2;

  const items = [];
  lines.forEach((line, li) => {
    const widths = line.map((w) => ctx.measureText(w).width);
    const totalW = widths.reduce((acc, v) => acc + v, 0);
    const isLast = li === lines.length - 1;
    const centerY = top + li * pitch + pitch / 2;

    // Ala bratvid2: baris penuh dilebarkan (justify) selebar area teks.
    // Baris terakhir & baris berisi satu kata diletakkan di tengah.
    let gap = spaceW;
    let x;
    if (!isLast && line.length > 1) {
      gap = (maxWidth - totalW) / (line.length - 1);
      x = MARGIN_X;
    } else {
      x = (W - (totalW + spaceW * (line.length - 1))) / 2;
    }

    line.forEach((word, j) => {
      items.push({ text: word, x, w: widths[j], centerY, baseline: centerY + capH / 2 });
      x += widths[j] + gap;
    });
  });

  return { fontSize, items };
}

// ====== Animasi (dari bratvid2, disesuaikan ke 30fps) ======
const STAGGER = 3; // jeda antar kata (frame)
const BOUNCE = 14; // lama satu kata pop (frame)
const HL_SECOND = 19; // sapuan kilau kedua (frame)
const LEAD = 3; // jeda kosong di awal (frame)

function easeOutBack(x) {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function wordState(frame, index) {
  const cur = frame - index * STAGGER;
  if (cur < 0) return { scale: 0, alpha: 0, visible: false };
  if (cur >= BOUNCE) return { scale: 1, alpha: 1, visible: true };
  const prog = cur / (BOUNCE - 1);
  return { scale: 0.2 + 0.8 * easeOutBack(prog), alpha: Math.min(1, prog * 1.8), visible: true };
}

// Satu layer, dua kanal (dipisah di ffmpeg):
//  - kanal MERAH = teks. Di-blend "difference" dengan video: area hitam = video apa adanya,
//    teks = warna video dibalik (di latar hitam jadi putih, di flash putih jadi hitam),
//    jadi warna tulisan selalu menyesuaikan latar.
//  - kanal HIJAU = sapuan kilau (shimmer) diagonal ala bratvid2, di-blend "screen"
//    (menerangi video + teks seperti kilau di bratvid2).
async function renderTextLayer(layout, states, highlight) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ff0000";
  ctx.font = `${layout.fontSize}px ${FONT_FAMILY}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  layout.items.forEach((it, i) => {
    const st = states[i];
    if (!st || !st.visible) return;
    const cx = it.x + it.w / 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, st.alpha));
    ctx.translate(cx, it.centerY);
    ctx.scale(st.scale, st.scale);
    ctx.translate(-cx, -it.centerY);
    ctx.fillText(it.text, it.x, it.baseline);
    ctx.restore();
  });

  if (highlight > 0 && highlight <= 1) {
    const L = (W + H) * 0.475;
    const a = -L + highlight * ((W + H) / 2 + L);
    const grad = ctx.createLinearGradient(a, a, a + L, a + L);
    grad.addColorStop(0.0, "rgba(0,255,0,0)");
    grad.addColorStop(0.1, "rgba(0,255,0,0.35)");
    grad.addColorStop(0.25, "rgba(0,255,0,0.95)");
    grad.addColorStop(0.38, "rgba(0,255,0,0.35)");
    grad.addColorStop(0.45, "rgba(0,255,0,0.05)");
    grad.addColorStop(0.52, "rgba(0,255,0,0.05)");
    grad.addColorStop(0.6, "rgba(0,255,0,0.35)");
    grad.addColorStop(0.75, "rgba(0,255,0,0.95)");
    grad.addColorStop(0.88, "rgba(0,255,0,0.35)");
    grad.addColorStop(1.0, "rgba(0,255,0,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }

  return canvas.encode("png");
}

async function generateBratVideo3({ text, format = "mp4" }) {
  if (!fs.existsSync(TEMPLATE_PATH)) throw new Error("File template video tidak ditemukan (assets/bratvid3-template.mp4)");

  await ensureFont();

  const clean = String(text)
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(" ").filter(Boolean).slice(0, 30);
  if (!words.length) throw new Error("Teks kosong");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brat3-"));

  try {
    const probe = createCanvas(W, H).getContext("2d");
    const layout = buildLayout(probe, words);
    const n = words.length;
    const hidden = words.map(() => ({ scale: 0, alpha: 0, visible: false }));
    const allVisible = words.map(() => ({ scale: 1, alpha: 1, visible: true }));

    const tasks = [];
    tasks.push({ states: hidden, highlight: 0, duration: LEAD / FPS });

    const totalBounce = (n - 1) * STAGGER + BOUNCE;
    for (let f = 0; f < totalBounce; f++) {
      tasks.push({ states: words.map((_, i) => wordState(f, i)), highlight: (f + 1) / totalBounce, duration: 1 / FPS });
    }
    for (let h = 0; h < HL_SECOND; h++) {
      tasks.push({ states: allVisible, highlight: (h + 1) / HL_SECOND, duration: 1 / FPS });
    }
    const animSeconds = tasks.reduce((a, t) => a + t.duration, 0);
    tasks.push({ states: allVisible, highlight: 0, duration: Math.max(0.5, TEMPLATE_SECONDS - animSeconds) + 1 });

    // Render berurutan (paralel bisa segfault di beberapa versi @napi-rs/canvas)
    const manifest = [];
    let lastPath = null;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const buffer = await renderTextLayer(layout, t.states, t.highlight);
      const framePath = path.join(tmpDir, `frame-${String(i + 1).padStart(5, "0")}.png`);
      fs.writeFileSync(framePath, buffer);
      manifest.push(`file '${framePath.replace(/'/g, "'\\''")}'`);
      manifest.push(`duration ${t.duration}`);
      lastPath = framePath;
    }
    manifest.push(`file '${lastPath.replace(/'/g, "'\\''")}'`);

    const concatPath = path.join(tmpDir, "concat.txt");
    fs.writeFileSync(concatPath, manifest.join("\n"));

    // Latar SELALU hitam (warna asli template): tidak ada pembalikan/pemrosesan warna,
    // jadi saat flash, layar tetap memutih menutupi layar seperti video aslinya.
    const composite =
      `[0:v]format=gbrp[base];` +
      `[1:v]setpts=PTS-STARTPTS,fps=${FPS},format=rgb24,extractplanes=r+g[tr][tg];` +
      `[tr]format=gbrp[m];[tg]format=gbrp[gl];` +
      `[base][m]blend=all_mode=difference:shortest=1[d];` +
      `[d][gl]blend=all_mode=screen:shortest=1,format=yuv420p`;

    const ext = format === "gif" ? "gif" : "mp4";
    const outPath = path.join(tmpDir, `bratvid3-${Date.now()}.${ext}`);
    const ffmpeg = getFfmpegPath();

    if (format === "gif") {
      const filter = `${composite}[c];[c]fps=15,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer[g]`;
      await execFileAsync(ffmpeg, [
        "-y", "-i", TEMPLATE_PATH, "-f", "concat", "-safe", "0", "-i", concatPath,
        "-filter_complex", filter, "-map", "[g]", "-loop", "0", outPath
      ], { maxBuffer: 1024 * 1024 * 20 });
    } else {
      await execFileAsync(ffmpeg, [
        "-y", "-i", TEMPLATE_PATH, "-f", "concat", "-safe", "0", "-i", concatPath,
        "-filter_complex", `${composite}[out]`,
        "-map", "[out]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", outPath
      ], { maxBuffer: 1024 * 1024 * 20 });
    }

    return { buffer: fs.readFileSync(outPath), ext };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = {
  name: "Brat Video V3 (Flash Effect)",
  desc: "Campuran template flash/strobe (lengkap dengan audionya) + bratvid2: teks layout melebar ala brat, muncul pop-bounce, disapu kilau diagonal, tepat di tengah layar. Latar hitam ala video aslinya, dan momen flash tetap memutih menutupi layar utuh. Warna teks otomatis menyesuaikan latar. Cukup isi teksnya (maks 30 kata).",
  category: "Image Creator",
  path: "/api/canvas/bratvid3?apikey=&text=",
  async run(req, res) {
    const { apikey, text, format } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }
    if (!/[\p{L}\p{N}]/u.test(String(text))) {
      return res.status(400).json({ status: false, error: "Parameter 'text' harus berisi huruf atau angka" });
    }

    try {
      const { buffer, ext } = await generateBratVideo3({
        text,
        format: format === "gif" ? "gif" : "mp4"
      });

      res.writeHead(200, {
        "Content-Type": ext === "gif" ? "image/gif" : "video/mp4",
        "Content-Length": buffer.length
      });
      return res.end(buffer);
    } catch (error) {
      console.error("Bratvid3 Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal generate brat video v3: " + String(error.stderr || error.message || error).replace(/\s+/g, " ").slice(0, 300)
      });
    }
  }
};
