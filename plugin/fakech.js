const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { ensureCached, fetchImageBuffer, checkApikey, sendPng } = require("./lib/canvas-common");

const FONT_URL = "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2";
const BG_URL = "https://raw.githubusercontent.com/ryyntwx/Image-rinn/refs/heads/main/153a185e-f1de-4078-8042-fdfc56592c3d.png";

let fontReady = false;

async function generateFakeCh(photoUrl, nama, pengikut, jam) {
  const fontLocal = await ensureCached(FONT_URL, "fakech_inter.woff2");
  const bgLocal = await ensureCached(BG_URL, "fakech_bg.png");

  if (!fontReady) {
    GlobalFonts.registerFromPath(fontLocal, "Inter");
    fontReady = true;
  }

  const ppBuffer = await fetchImageBuffer(photoUrl);
  const bgImg = await loadImage(bgLocal);
  const ppImg = await loadImage(ppBuffer);

  const canvas = createCanvas(bgImg.width, bgImg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  const namaText = nama;
  const pengikutText = `${pengikut} pengikut`;
  const jamText = jam;

  const config = {
    pp: { x: 585, y: 622, r: 213 },
    nama: { y: 908, maxSize: 68, maxWidth: 1000 },
    pengikut: { y: 995, size: 45 },
    jam: { x: 116, y: 63, size: 43 }
  };

  ctx.save();
  ctx.beginPath();
  ctx.arc(config.pp.x, config.pp.y, config.pp.r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(ppImg, config.pp.x - config.pp.r, config.pp.y - config.pp.r, config.pp.r * 2, config.pp.r * 2);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = config.nama.maxSize;
  ctx.font = `900 ${fontSize}px Inter, sans-serif`;

  while (ctx.measureText(namaText).width > config.nama.maxWidth && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
  }
  ctx.fillText(namaText, canvas.width / 2, config.nama.y);

  ctx.fillStyle = "#8E8E93";
  ctx.font = `500 ${config.pengikut.size}px Inter, sans-serif`;
  ctx.fillText(pengikutText, canvas.width / 2, config.pengikut.y);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${config.jam.size}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(jamText, config.jam.x, config.jam.y);

  return canvas.encode("png");
}

module.exports = {
  name: "Fake Channel iOS",
  desc: "Generate tampilan channel WhatsApp iOS palsu (foto + nama + pengikut + jam).",
  category: "Image Creator",
  path: "/api/canvas/fakech?apikey=&photo=&nama=&pengikut=&jam=",
  async run(req, res) {
    if (!checkApikey(req, res)) return;

    const { photo, nama, pengikut, jam } = req.query;
    if (!photo || !nama || !pengikut || !jam) {
      return res.status(400).json({ status: false, error: "Parameter 'photo', 'nama', 'pengikut', dan 'jam' wajib diisi" });
    }

    try {
      const buffer = await generateFakeCh(photo, nama.trim(), pengikut.trim(), jam.trim());
      sendPng(res, buffer);
    } catch (error) {
      console.error("Fakech Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal generate fakech (cek url foto valid?)" });
    }
  }
};
