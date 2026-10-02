const { createCanvas } = require("@napi-rs/canvas");

const W = 620;
const PAD = 34;
const MONO = '"Courier New", monospace';
const MONO_BOLD = 'bold "Courier New", monospace';

function formatRp(n) {
  const v = Math.round(Number(n) || 0);
  return "Rp " + v.toLocaleString("id-ID");
}

function truncate(s, max) {
  const str = String(s);
  return str.length > max ? str.slice(0, max - 1).trimEnd() + "\u2026" : str;
}

function parseItems(raw) {
  const s = String(raw).trim();
  let list = [];

  if (s.startsWith("[")) {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) throw new Error("Format items JSON harus berupa array");
    list = arr.map((it) => ({
      nama: truncate(it.nama || it.name || "Item", 120),
      qty: Math.max(1, parseInt(it.qty ?? it.jumlah ?? 1, 10) || 1),
      harga: Math.max(0, parseFloat(it.harga ?? it.price ?? 0) || 0)
    }));
  } else {
    list = s.split("|").map((seg) => {
      const parts = seg.split(",");
      return {
        nama: truncate((parts[0] || "Item").trim(), 120),
        qty: Math.max(1, parseInt(parts[1], 10) || 1),
        harga: Math.max(0, parseFloat(parts[2]) || 0)
      };
    });
  }

  list = list.filter((it) => it.nama);
  if (!list.length) throw new Error("Tidak ada item yang valid");
  if (list.length > 40) list = list.slice(0, 40);
  return list;
}

function wrapMono(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function dashedLine(ctx, y) {
  ctx.save();
  ctx.strokeStyle = "#999999";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.restore();
}

function draw(opts) {
  const { toko, alamat, telp, noStruk, kasir, items, pajakPersen, diskon, metode, bayar, catatan } = opts;

  const ctx0 = createCanvas(10, 10).getContext("2d");
  ctx0.font = "15px " + MONO;
  const itemLineHeights = items.map((it) => {
    const nameLines = wrapMono(ctx0, it.nama, W - PAD * 2);
    return 22 * nameLines.length + 22; // nama (bisa multi-baris) + baris qty/harga
  });
  const itemsHeight = itemLineHeights.reduce((a, b) => a + b, 0);

  const subtotal = items.reduce((a, it) => a + it.qty * it.harga, 0);
  const pajakNominal = (subtotal * pajakPersen) / 100;
  const total = Math.max(0, subtotal + pajakNominal - diskon);
  const kembalian = bayar != null ? bayar - total : null;

  let extraTotalLines = 1; // total
  if (pajakPersen > 0) extraTotalLines++;
  if (diskon > 0) extraTotalLines++;
  let extraBayarLines = 0;
  if (metode) extraBayarLines++;
  if (bayar != null) extraBayarLines += 2; // bayar + kembalian/kurang

  const headerH = 190;
  const metaH = 70;
  const footerH = 110;
  const H = headerH + metaH + 20 + itemsHeight + 20 + extraTotalLines * 26 + 20 + extraBayarLines * 26 + footerH;

  const canvas = createCanvas(W, Math.round(H));
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  let y = 46;
  ctx.textAlign = "center";
  ctx.fillStyle = "#111111";
  ctx.font = 'bold 26px Arial, sans-serif';
  wrapMono(ctx, toko, W - PAD * 2).forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 32;
  });

  ctx.font = "15px " + MONO;
  ctx.fillStyle = "#333333";
  if (alamat) {
    wrapMono(ctx, alamat, W - PAD * 2).forEach((line) => {
      ctx.fillText(line, W / 2, y);
      y += 20;
    });
  }
  if (telp) {
    ctx.fillText("Telp: " + telp, W / 2, y);
    y += 20;
  }

  y += 10;
  dashedLine(ctx, y);
  y += 26;

  ctx.textAlign = "left";
  ctx.font = "15px " + MONO;
  ctx.fillStyle = "#111111";
  const now = new Date();
  const tgl = now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  ctx.fillText("No. Struk", PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(noStruk, W - PAD, y);
  y += 22;

  ctx.textAlign = "left";
  ctx.fillText("Tanggal", PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(`${tgl} ${jam}`, W - PAD, y);
  y += 22;

  if (kasir) {
    ctx.textAlign = "left";
    ctx.fillText("Kasir", PAD, y);
    ctx.textAlign = "right";
    ctx.fillText(kasir, W - PAD, y);
    y += 22;
  }

  y += 6;
  dashedLine(ctx, y);
  y += 26;

  items.forEach((it) => {
    ctx.textAlign = "left";
    ctx.font = "15px " + MONO;
    ctx.fillStyle = "#111111";
    const nameLines = wrapMono(ctx, it.nama, W - PAD * 2);
    nameLines.forEach((line) => {
      ctx.fillText(line, PAD, y);
      y += 22;
    });

    ctx.fillStyle = "#555555";
    ctx.textAlign = "left";
    ctx.fillText(`  ${it.qty} x ${formatRp(it.harga)}`, PAD, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111111";
    ctx.fillText(formatRp(it.qty * it.harga), W - PAD, y);
    y += 22;
  });

  y += 4;
  dashedLine(ctx, y);
  y += 26;

  const totalRow = (label, value, bold) => {
    ctx.textAlign = "left";
    ctx.font = (bold ? "bold " : "") + "16px " + MONO;
    ctx.fillText(label, PAD, y);
    ctx.textAlign = "right";
    ctx.fillText(value, W - PAD, y);
    y += 26;
  };

  totalRow("Subtotal", formatRp(subtotal), false);
  if (pajakPersen > 0) totalRow(`Pajak (${pajakPersen}%)`, formatRp(pajakNominal), false);
  if (diskon > 0) totalRow("Diskon", "-" + formatRp(diskon), false);
  ctx.font = "bold 19px " + MONO;
  totalRow("TOTAL", formatRp(total), true);

  if (metode || bayar != null) {
    y += 4;
    dashedLine(ctx, y);
    y += 26;
    if (metode) totalRow("Metode", metode, false);
    if (bayar != null) {
      totalRow("Bayar", formatRp(bayar), false);
      if (kembalian >= 0) totalRow("Kembalian", formatRp(kembalian), false);
      else totalRow("Kurang Bayar", formatRp(Math.abs(kembalian)), false);
    }
  }

  y += 14;
  dashedLine(ctx, y);
  y += 34;

  ctx.textAlign = "center";
  ctx.font = "15px " + MONO;
  ctx.fillStyle = "#333333";
  wrapMono(ctx, catatan, W - PAD * 2).forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 20;
  });

  y += 16;
  ctx.font = "12px " + MONO;
  ctx.fillStyle = "#999999";
  ctx.fillText("Dibuat otomatis via Wanz Api", W / 2, y);

  return canvas.encode("png");
}

module.exports = {
  name: "Struk Belanja Generator",
  desc: "Buat gambar struk belanja lengkap (toko, tanggal, daftar item, subtotal, pajak, diskon, total, metode bayar, kembalian). items dipisah '|', tiap item 'nama,qty,harga' (atau JSON array [{\"nama\":..,\"qty\":..,\"harga\":..}]).",
  category: "Design",
  path: "/api/tools/struk?apikey=&toko=Wanz Store&items=Kopi Susu,2,15000|Roti Bakar,1,12000&pajak=10&bayar=50000",
  async run(req, res) {
    const { apikey, toko, alamat, telp, noStruk, kasir, items, pajak, diskon, metode, bayar, catatan } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!items) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'items' wajib diisi, format: nama,qty,harga|nama2,qty2,harga2"
      });
    }

    try {
      const parsedItems = parseItems(items);
      const pajakPersen = Math.max(0, Math.min(100, parseFloat(pajak) || 0));
      const diskonNominal = Math.max(0, parseFloat(diskon) || 0);
      const bayarNominal = bayar !== undefined && bayar !== "" ? Math.max(0, parseFloat(bayar) || 0) : null;

      const buffer = await draw({
        toko: toko ? String(toko).slice(0, 60) : "Wanz Store",
        alamat: alamat ? String(alamat).slice(0, 120) : "",
        telp: telp ? String(telp).slice(0, 40) : "",
        noStruk: noStruk ? String(noStruk).slice(0, 30) : String(Date.now()).slice(-8),
        kasir: kasir ? String(kasir).slice(0, 40) : "",
        items: parsedItems,
        pajakPersen,
        diskon: diskonNominal,
        metode: metode ? String(metode).slice(0, 30) : "",
        bayar: bayarNominal,
        catatan: catatan ? String(catatan).slice(0, 150) : "Terima kasih telah berbelanja!"
      });

      res.setHeader("Cache-Control", "no-store");
      res.writeHead(200, { "Content-Type": "image/png", "Content-Length": buffer.length });
      return res.end(buffer);
    } catch (error) {
      console.error("Struk Belanja Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal membuat struk: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
