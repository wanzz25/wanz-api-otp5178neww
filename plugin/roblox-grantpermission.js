const PERM_URL = "https://apis.roblox.com/asset-permissions-api/v1/assets/permissions";
const isId = (v) => /^\d{1,20}$/.test(String(v ?? "").trim());

// Satu kali percobaan jujur ke Roblox untuk satu penerima (Group atau User/Player)
async function grantOne(robloxkey, assetId, subjectType, subjectId) {
  const response = await fetch(PERM_URL, {
    method: "PATCH",
    headers: { "x-api-key": robloxkey, "Content-Type": "application/json" },
    body: JSON.stringify({
      subjectType,
      subjectId: String(subjectId),
      action: "Use",
      requests: [{ assetId: Number(assetId) }]
    }),
    signal: AbortSignal.timeout(20000)
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return { http: response.status, error: data?.message || `Roblox HTTP ${response.status}` };
  }
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  if (errors.length) {
    return { granted: false, subjectType, subjectId: String(subjectId), reason: errors.map((e) => e?.code || JSON.stringify(e)).join(", ") };
  }
  const successIds = Array.isArray(data?.successAssetIds) ? data.successAssetIds.map(String) : null;
  const granted = !successIds || successIds.includes(String(assetId));
  return { granted, subjectType, subjectId: String(subjectId), assetId: String(assetId) };
}

// allow: "group" (khusus grup), "player" (khusus Player ID/User ID), "any" (salah satu atau keduanya)
function makeRoute({ name, desc, path, allow }) {
  return {
    name,
    desc,
    category: "Roblox",
    path,
    async run(req, res) {
      const q = req.query;
      const { apikey, robloxkey, assetId } = q;
      const bad = (m) => res.status(400).json({ status: false, error: m });

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
      }
      if (!robloxkey) return bad("Parameter 'robloxkey' wajib diisi");
      if (!assetId) return bad("Parameter 'assetId' wajib diisi");
      if (!isId(assetId)) return bad("'assetId' harus berupa angka");

      const groupId = allow !== "player" ? String(q.groupId ?? "").trim() : "";
      // Player ID = Roblox User ID. Alias yang diterima: playerId, targetUserId, userId
      const playerId = allow !== "group" ? String(q.playerId ?? q.targetUserId ?? q.userId ?? "").trim() : "";

      const subjects = [];
      if (groupId) {
        if (!isId(groupId)) return bad("'groupId' harus berupa angka");
        subjects.push(["Group", groupId]);
      }
      if (playerId) {
        if (!isId(playerId)) return bad("'playerId' harus berupa angka (Roblox User ID)");
        subjects.push(["User", playerId]);
      }
      if (!subjects.length) {
        return bad(
          allow === "group" ? "Parameter 'groupId' wajib diisi"
          : allow === "player" ? "Parameter 'playerId' wajib diisi"
          : "Isi 'groupId' (jalur grup) dan/atau 'playerId' (jalur Player ID)"
        );
      }

      try {
        const results = [];
        for (const [type, id] of subjects) {
          const r = await grantOne(robloxkey, assetId, type, id);
          if (r.http) {
            return res.status(r.http === 401 ? 401 : 502).json({ status: false, error: "Roblox menolak permintaan: " + r.error, subjectType: type, subjectId: id });
          }
          results.push(r);
        }
        if (results.length === 1) return res.status(200).json({ status: true, result: results[0] });
        return res.status(200).json({ status: true, result: { assetId: String(assetId), granted: results.every((r) => r.granted), results } });
      } catch (error) {
        console.error("Roblox Grant Permission Error:", error.message);
        return res.status(500).json({ status: false, error: "Gagal memproses grant permission: " + String(error.message || error).slice(0, 300) });
      }
    }
  };
}

module.exports = [
  makeRoute({
    name: "Roblox Grant Permission (Grup)",
    desc: "Jalur 1: beri izin 'Use' sebuah asset (misal audio) ke satu Group Roblox lewat groupId. Satu kali percobaan jujur; kalau Roblox menolak, dilaporkan apa adanya.",
    path: "/api/roblox/grant-permission-group?apikey=&robloxkey=&assetId=&groupId=",
    allow: "group"
  }),
  makeRoute({
    name: "Roblox Grant Permission (Player ID)",
    desc: "Jalur 2: beri izin 'Use' sebuah asset (misal audio) ke satu Player lewat playerId (Roblox User ID). Satu kali percobaan jujur; kalau Roblox menolak, dilaporkan apa adanya.",
    path: "/api/roblox/grant-permission-player?apikey=&robloxkey=&assetId=&playerId=",
    allow: "player"
  }),
  makeRoute({
    name: "Roblox Grant Permission (Grup atau Player)",
    desc: "Gabungan: isi groupId (grup), playerId (Roblox User ID), atau keduanya sekaligus untuk memberi izin 'Use' ke kedua penerima dalam satu panggilan. Endpoint lama /grant-permission tetap bisa dipakai.",
    path: "/api/roblox/grant-permission?apikey=&robloxkey=&assetId=&groupId=&playerId=",
    allow: "any"
  })
];
