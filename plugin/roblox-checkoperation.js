const OPS_URL = "https://apis.roblox.com/assets/v1/operations";
const ASSETS_URL = "https://apis.roblox.com/assets/v1/assets";

function normalizeModeration(state) {
  if (!state) return null;
  const value = String(state).toUpperCase();
  if (value.includes("APPROV")) return "APPROVED";
  if (value.includes("REJECT")) return "REJECTED";
  if (value.includes("REVIEW")) return "REVIEWING";
  return value;
}

module.exports = {
  name: "Roblox Check Operation",
  desc: "Cek status satu kali (bukan menunggu) dari operationId hasil /api/roblox/upload-audio. Panggil berulang dari sisi kamu (bot/cron) sampai statusnya selesai; endpoint ini tidak menunggu di server.",
  category: "Roblox",
  path: "/api/roblox/check-operation?apikey=&robloxkey=&operationId=",
  async run(req, res) {
    const { apikey, robloxkey, operationId } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!robloxkey) {
      return res.status(400).json({ status: false, error: "Parameter 'robloxkey' wajib diisi" });
    }
    if (!operationId) {
      return res.status(400).json({ status: false, error: "Parameter 'operationId' wajib diisi" });
    }

    try {
      const opRes = await fetch(`${OPS_URL}/${operationId}`, {
        headers: { "x-api-key": robloxkey },
        signal: AbortSignal.timeout(20000)
      });
      const opData = await opRes.json().catch(() => null);

      if (!opRes.ok) {
        const message = opData?.message || `Roblox HTTP ${opRes.status}`;
        return res.status(opRes.status === 401 ? 401 : 502).json({ status: false, error: "Roblox menolak permintaan: " + message });
      }

      if (!opData?.done) {
        return res.status(200).json({ status: true, result: { done: false, info: "Masih diproses Roblox, cek lagi beberapa detik lagi" } });
      }

      if (opData.error) {
        return res.status(200).json({ status: true, result: { done: true, failed: true, error: opData.error?.message || JSON.stringify(opData.error) } });
      }

      const assetId = String(opData.response?.assetId || "");
      if (!assetId) {
        return res.status(200).json({ status: true, result: { done: true, failed: true, error: "Operation selesai tapi tidak ada assetId" } });
      }

      // Operation selesai -> cek status moderasi terkini asset-nya (satu kali, bukan loop)
      const assetRes = await fetch(`${ASSETS_URL}/${assetId}`, {
        headers: { "x-api-key": robloxkey },
        signal: AbortSignal.timeout(20000)
      });
      const assetData = await assetRes.json().catch(() => null);
      const moderation = normalizeModeration(assetData?.moderationResult?.moderationState) || "REVIEWING";

      return res.status(200).json({
        status: true,
        result: { done: true, assetId, moderation, approved: moderation === "APPROVED" }
      });
    } catch (error) {
      console.error("Roblox Check Operation Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal cek status: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
