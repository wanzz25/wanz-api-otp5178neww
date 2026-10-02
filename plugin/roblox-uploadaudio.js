const { fetchImageBuffer } = require("./lib/canvas-common"); // reuse: fetch arraybuffer dari URL apa pun

const ASSETS_URL = "https://apis.roblox.com/assets/v1/assets";

function cleanTitle(rawTitle = "Audio") {
  const cleaned = String(rawTitle)
    .split(/[\\/]/)
    .pop()
    .replace(/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "Audio").slice(0, 50).trim();
}

function getContentType(fileName = "audio.mp3") {
  const ext = String(fileName).toLowerCase().split(".").pop();
  const types = {
    mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav",
    ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg", flac: "audio/flac", webm: "audio/webm"
  };
  return types[ext] || "audio/mpeg";
}

module.exports = {
  name: "Roblox Upload Audio",
  desc: "Upload file audio ke akun Roblox-mu sendiri (Open Cloud API). Wajib isi robloxkey (API key milikmu dari Creator Dashboard) dan userId (Roblox User ID pemilik key tsb). Endpoint ini HANYA mengunggah dan langsung kembalikan operationId — proses moderasi Roblox makan waktu lama, jadi cek statusnya lewat /api/roblox/check-operation, jangan ditunggu di sini.",
  category: "Roblox",
  path: "/api/roblox/upload-audio?apikey=&robloxkey=&userId=&url=&title=",
  async run(req, res) {
    const { apikey, robloxkey, userId, groupId, url, title, fileName } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!robloxkey) {
      return res.status(400).json({ status: false, error: "Parameter 'robloxkey' (API key Roblox milikmu sendiri, dari Creator Dashboard) wajib diisi" });
    }
    if (!userId && !groupId) {
      return res.status(400).json({ status: false, error: "Isi 'userId' (Roblox User ID pemilik API key) atau 'groupId' jika upload atas nama grup" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' (link file audio) wajib diisi" });
    }

    try {
      const audioBuffer = await fetchImageBuffer(url); // helper generik: ambil buffer apa pun dari URL
      if (!audioBuffer || !audioBuffer.length) {
        return res.status(400).json({ status: false, error: "Gagal mengunduh audio dari URL, atau file kosong" });
      }
      const MAX_SIZE = 20 * 1024 * 1024;
      if (audioBuffer.length > MAX_SIZE) {
        return res.status(400).json({ status: false, error: `Audio terlalu besar. Maksimal ${MAX_SIZE / 1024 / 1024} MB` });
      }

      const finalTitle = cleanTitle(title || fileName);
      const safeFileName = fileName || "audio.mp3";

      const form = new FormData();
      form.append(
        "request",
        JSON.stringify({
          assetType: "Audio",
          displayName: finalTitle,
          description: "Diunggah via Wanz Api",
          creationContext: groupId
            ? { creator: { groupId: String(groupId) } }
            : { creator: { userId: String(userId) } }
        })
      );
      const blob = new Blob([audioBuffer], { type: getContentType(safeFileName) });
      form.append("fileContent", blob, safeFileName);

      const response = await fetch(ASSETS_URL, {
        method: "POST",
        headers: { "x-api-key": robloxkey },
        body: form,
        signal: AbortSignal.timeout(45000)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.error?.message || `Roblox HTTP ${response.status}`;
        return res.status(response.status === 401 ? 401 : 502).json({
          status: false,
          error: "Roblox menolak permintaan: " + message
        });
      }

      const operationPath = data?.path || data?.operationPath || data?.operationId || data?.id;
      if (!operationPath) {
        return res.status(502).json({ status: false, error: "Roblox tidak memberikan operation ID", raw: data });
      }
      const operationId = String(operationPath).split("/").pop();

      return res.status(200).json({
        status: true,
        result: {
          title: finalTitle,
          operationId,
          info: "Upload terkirim. Cek status pemrosesan & moderasi lewat GET /api/roblox/check-operation?robloxkey=...&operationId=" + operationId
        }
      });
    } catch (error) {
      console.error("Roblox Upload Audio Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal upload audio ke Roblox: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
