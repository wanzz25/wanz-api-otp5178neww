const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");
const { fetchImageBuffer } = require("./lib/canvas-common");

const SERVERS = [
  "api1g", "api2g", "api3g", "api8g", "api9g", "api10g", "api11g",
  "api12g", "api13g", "api14g", "api15g", "api16g", "api17g", "api18g",
  "api19g", "api20g", "api21g", "api22g", "api24g", "api25g"
];

async function getToken() {
  const html = await axios.get("https://www.iloveimg.com/upscale-image", { timeout: 15000 });
  const $ = cheerio.load(html.data);
  const script = $("script").filter((_, el) => $(el).html()?.includes("ilovepdfConfig =")).html();
  if (!script) throw new Error("Config tidak ditemukan");

  const jsonStr = script.split("ilovepdfConfig = ")[1].split(";")[0];
  const json = JSON.parse(jsonStr);
  const csrf = $('meta[name="csrf-token"]').attr("content");
  const taskMatch = script.match(/ilovepdfConfig\.taskId\s*=\s*'([^']+)'/);
  const taskId = taskMatch ? taskMatch[1] : null;

  if (!json?.token || !csrf) throw new Error("Token/CSRF gagal diambil");
  if (!taskId) throw new Error("taskId tidak ditemukan di halaman");

  return { token: json.token, csrf, taskId };
}

async function uploadImage(server, headers, buffer, task) {
  const form = new FormData();
  form.append("name", "image.jpg");
  form.append("chunk", "0");
  form.append("chunks", "1");
  form.append("task", task);
  form.append("preview", "1");
  form.append("file", buffer, "image.jpg");
  const res = await axios.post(`https://${server}.iloveimg.com/v1/upload`, form, {
    headers: { ...headers, ...form.getHeaders() },
    timeout: 25000
  });
  return res.data;
}

async function imageHD(buffer, scale) {
  const { token, csrf, taskId } = await getToken();
  const server = SERVERS[Math.floor(Math.random() * SERVERS.length)];

  const headers = {
    Authorization: "Bearer " + token,
    Origin: "https://www.iloveimg.com/",
    Cookie: "_csrf=" + csrf,
    "User-Agent": "Mozilla/5.0"
  };

  const upload = await uploadImage(server, headers, buffer, taskId);

  const form = new FormData();
  form.append("task", taskId);
  form.append("server_filename", upload.server_filename);
  form.append("scale", scale);

  const res = await axios.post(`https://${server}.iloveimg.com/v1/upscale`, form, {
    headers: { ...headers, ...form.getHeaders() },
    responseType: "arraybuffer",
    timeout: 45000
  });
  return res.data;
}

module.exports = {
  name: "Image Upscale HD",
  desc: "Perbesar & pertajam resolusi gambar dari URL (skala 2x atau 4x) menggunakan iloveimg.",
  category: "Tools",
  path: "/api/tools/upscale?apikey=&url=&scale=4",
  async run(req, res) {
    const { apikey, url, scale } = req.query;
    const s = [2, 4].includes(Number(scale)) ? Number(scale) : 4;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const buffer = await fetchImageBuffer(url);
      const resultBuffer = await imageHD(buffer, s);

      res.writeHead(200, { "Content-Type": "image/jpeg", "Content-Length": resultBuffer.length });
      return res.end(resultBuffer);
    } catch (error) {
      console.error("Upscale Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal upscale gambar: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
