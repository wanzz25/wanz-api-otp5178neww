function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Proporsi peran khusus seimbang untuk jumlah pemain tertentu (sisanya jadi Villager)
function buildRoleList(n) {
  const roles = [];
  const werewolves = Math.max(1, Math.round(n / 4));
  for (let i = 0; i < werewolves; i++) roles.push("Werewolf");

  if (n >= 5) roles.push("Seer");
  if (n >= 6) roles.push("Guardian");
  if (n >= 7) roles.push("Sorcerer");
  if (n >= 9) roles.push("Hunter");

  while (roles.length < n) roles.push("Villager");
  return roles.slice(0, n);
}

module.exports = {
  name: "Werewolf Role Distributor",
  desc: "Bagikan peran permainan Werewolf (Werewolf, Seer, Guardian, Sorcerer, Hunter, Villager) secara acak dan seimbang. Kirim players (jumlah pemain, 4-24).",
  category: "Generator",
  path: "/api/game/werewolf-role?apikey=&players=8",
  async run(req, res) {
    const { apikey, players } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const n = parseInt(players, 10);
    if (!players || Number.isNaN(n) || n < 4 || n > 24) {
      return res.status(400).json({ status: false, error: "Parameter 'players' wajib diisi, angka 4-24" });
    }

    try {
      const roles = shuffle(buildRoleList(n));
      const result = roles.map((role, i) => ({ pemain: i + 1, peran: role }));
      const ringkasan = roles.reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {});
      return res.status(200).json({ status: true, result: { pembagian: result, ringkasan } });
    } catch (error) {
      console.error("Werewolf Role Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal membagikan peran: " + String(error.message || error).slice(0, 300) });
    }
  }
};
