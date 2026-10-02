const axios = require("axios");
const FormData = require("form-data");

const API = "https://catbox.moe/user/api.php";

async function uploadCatbox(fileUrl) {
  const fileRes = await axios.get(fileUrl, {
    responseType: "arraybuffer",
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  let filename = "file";
  try {
    filename = decodeURIComponent(new URL(fileUrl).pathname.split("/").pop()) || "file";
  } catch (e) { /* pakai default */ }

  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", Buffer.from(fileRes.data), {
    filename,
    contentType: fileRes.headers["content-type"] || "application/octet-stream"
  });

  const res = await axios.post(API, form, {
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
    headers: {
      ...form.getHeaders(),
      "accept": "*/*",
      "user-agent": "Mozilla/5.0"
    }
  });

  const resultUrl = typeof res.data === "string" && res.data.startsWith("https://") ? res.data.trim() : null;

  if (!resultUrl) {
    throw new Error(typeof res.data === "string" ? res.data.slice(0, 300) : "Upload ke catbox gagal");
  }

  return resultUrl;
}

module.exports = {
  name: "Catbox Uploader",
  desc: "Upload ulang file dari sebuah URL ke catbox.moe, mengembalikan link permanen.",
  category: "Tools",
  path: "/api/tools/catbox?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const resultUrl = await uploadCatbox(url);
      return res.status(200).json({ status: true, result: { url: resultUrl } });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || error });
    }
  }
};
