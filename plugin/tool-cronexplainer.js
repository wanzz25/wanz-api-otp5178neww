const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function describeField(field, unit, names) {
  if (field === "*") return null;
  if (field.includes("/")) {
    const [, step] = field.split("/");
    return `setiap ${step} ${unit}`;
  }
  if (field.includes(",")) {
    const list = field.split(",").map((v) => (names ? names[parseInt(v, 10)] || v : v));
    return `pada ${unit} ${list.join(", ")}`;
  }
  if (field.includes("-")) {
    const [a, b] = field.split("-");
    const na = names ? names[parseInt(a, 10)] || a : a;
    const nb = names ? names[parseInt(b, 10)] || b : b;
    return `dari ${unit} ${na} sampai ${nb}`;
  }
  const val = names ? names[parseInt(field, 10)] || field : field;
  return `pada ${unit} ${val}`;
}

function explainCron(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Ekspresi cron harus terdiri dari 5 kolom: menit jam tanggal bulan hari");
  }
  const [minute, hour, dom, month, dow] = parts;

  // Kasus umum yang sering dipakai
  if (minute.startsWith("*/") && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return `Setiap ${minute.split("/")[1]} menit`;
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dom === "*" && month === "*" && dow === "*") {
    return `Setiap hari pukul ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dom === "*" && month === "*" && /^\d+$/.test(dow)) {
    return `Setiap hari ${DAY_NAMES[parseInt(dow, 10)] || dow} pukul ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && month === "*" && dow === "*") {
    return `Setiap tanggal ${dom} pukul ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  const bits = [];
  const bMin = describeField(minute, "menit", null);
  const bHour = describeField(hour, "jam", null);
  const bDom = describeField(dom, "tanggal", null);
  const bMonth = describeField(month, "bulan", MONTH_NAMES);
  const bDow = describeField(dow, "hari", DAY_NAMES);
  if (bMin) bits.push(bMin);
  if (bHour) bits.push(bHour);
  if (bDom) bits.push(bDom);
  if (bMonth) bits.push(bMonth);
  if (bDow) bits.push(bDow);

  return bits.length ? "Berjalan " + bits.join(", ") : "Berjalan setiap menit";
}

module.exports = {
  name: "Cron Explainer",
  desc: "Terjemahkan ekspresi jadwal Cron (5 kolom: menit jam tanggal bulan hari) menjadi kalimat bahasa Indonesia.",
  category: "Text",
  path: "/api/tools/cron-explainer?apikey=&cron=*/5 * * * *",
  async run(req, res) {
    const { apikey, cron } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!cron) {
      return res.status(400).json({ status: false, error: "Parameter 'cron' wajib diisi" });
    }

    try {
      const result = explainCron(cron);
      return res.status(200).json({ status: true, cron, result });
    } catch (error) {
      return res.status(400).json({ status: false, error: error.message });
    }
  }
};
