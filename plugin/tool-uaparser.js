function parseUA(ua) {
  const s = String(ua);
  const result = { browser: "Unknown", browserVersion: null, os: "Unknown", device: "Desktop" };

  // Device
  if (/Mobi|Android(?!.*Tablet)|iPhone/i.test(s)) result.device = "Mobile";
  else if (/Tablet|iPad/i.test(s)) result.device = "Tablet";

  // OS
  if (/Windows NT 10/i.test(s)) result.os = "Windows 10/11";
  else if (/Windows NT 6\.3/i.test(s)) result.os = "Windows 8.1";
  else if (/Windows NT 6\.1/i.test(s)) result.os = "Windows 7";
  else if (/Windows/i.test(s)) result.os = "Windows";
  else if (/Mac OS X (\d+[._]\d+)/i.test(s)) result.os = "macOS " + s.match(/Mac OS X (\d+[._]\d+)/i)[1].replace("_", ".");
  else if (/Android (\d+(\.\d+)?)/i.test(s)) result.os = "Android " + s.match(/Android (\d+(\.\d+)?)/i)[1];
  else if (/iPhone OS (\d+[._]\d+)/i.test(s)) result.os = "iOS " + s.match(/iPhone OS (\d+[._]\d+)/i)[1].replace("_", ".");
  else if (/CPU OS (\d+[._]\d+)/i.test(s)) result.os = "iPadOS " + s.match(/CPU OS (\d+[._]\d+)/i)[1].replace("_", ".");
  else if (/Linux/i.test(s)) result.os = "Linux";

  // Browser (urutan penting: Edge/OPR sebelum Chrome, Chrome sebelum Safari)
  let m;
  if ((m = s.match(/Edg\/([\d.]+)/))) { result.browser = "Edge"; result.browserVersion = m[1]; }
  else if ((m = s.match(/OPR\/([\d.]+)/))) { result.browser = "Opera"; result.browserVersion = m[1]; }
  else if ((m = s.match(/SamsungBrowser\/([\d.]+)/))) { result.browser = "Samsung Internet"; result.browserVersion = m[1]; }
  else if ((m = s.match(/Firefox\/([\d.]+)/))) { result.browser = "Firefox"; result.browserVersion = m[1]; }
  else if ((m = s.match(/CriOS\/([\d.]+)/))) { result.browser = "Chrome (iOS)"; result.browserVersion = m[1]; }
  else if ((m = s.match(/Chrome\/([\d.]+)/))) { result.browser = "Chrome"; result.browserVersion = m[1]; }
  else if ((m = s.match(/Version\/([\d.]+).*Safari/))) { result.browser = "Safari"; result.browserVersion = m[1]; }
  else if (/MSIE|Trident/i.test(s)) { result.browser = "Internet Explorer"; }

  result.isBot = /bot|crawl|spider|slurp|curl|wget|postman/i.test(s);

  return result;
}

module.exports = {
  name: "User-Agent Parser",
  desc: "Parse string User-Agent untuk mengidentifikasi Browser, Versi, Sistem Operasi, dan tipe perangkat (Desktop/Mobile/Tablet).",
  category: "Text",
  path: "/api/tools/useragent-parser?apikey=&ua=",
  async run(req, res) {
    const { apikey, ua } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!ua) {
      return res.status(400).json({ status: false, error: "Parameter 'ua' wajib diisi" });
    }

    try {
      const result = parseUA(ua);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("UA Parser Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
