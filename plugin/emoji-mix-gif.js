const fetch = require("node-fetch");

function encodeEmoji(emoji) {
  return [...emoji].map(char => char.codePointAt(0).toString(16)).join('-');
}

module.exports = [
  {
    name: "Emoji Mix",
    desc: "Mixed emoji generator (Emoji Kitchen).",
    category: "Tools",
    path: "/api/tools/emojimix?apikey=&emoji1=&emoji2=",
    async run(req, res) {
      const { apikey, emoji1, emoji2 } = req.query;
      
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: 'Apikey invalid' });
      }
      if (!emoji1 || !emoji2) {
        return res.status(400).json({ status: false, error: 'Emoji1 dan Emoji2 wajib diisi' });
      }

      try {
        const response = await fetch(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`);
        const json = await response.json();

        const url = json?.results?.[0]?.url;
        if (!url) throw new Error("Gagal mendapatkan hasil emoji mix");

        const image = await global.getBuffer(url);
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': image.length,
          'Cache-Control': 'public, max-age=86400'
        });
        return res.end(image);
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
      }
    }
  },
  {
    name: "Emoji To Gif",
    desc: "Convert emoji ke format webp (GIF style).",
    category: "Tools",
    path: "/api/tools/emojitogif?apikey=&emoji=",
    async run(req, res) {
      const { apikey, emoji } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: 'Apikey invalid' });
      }
      if (!emoji) {
        return res.status(400).json({ status: false, error: 'Emoji wajib diisi' });
      }

      try {
        const code = encodeEmoji(emoji);
        const buffer = await global.getBuffer(`https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`);
        
        if (buffer instanceof Error) throw new Error("Gagal mengambil buffer emoji");

        res.writeHead(200, {
          'Content-Type': 'image/webp',
          'Content-Length': buffer.length,
          'Cache-Control': 'public, max-age=86400'
        });
        return res.end(buffer);
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
      }
    }
  }
];
