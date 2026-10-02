const asupanList = [
  "https://d.top4top.io/m_3743tlv1r1.mp4",
  "https://b.top4top.io/m_3743nxaih1.mp4",
  "https://d.top4top.io/m_37436n4m41.mp4",
  "https://j.top4top.io/m_374393w201.mp4",
  "https://d.top4top.io/m_3743qmidy1.mp4",
  "https://l.top4top.io/m_374302swd1.mp4",
  "https://j.top4top.io/m_3743tzzyb1.mp4",
  "https://d.top4top.io/m_3743leu4q1.mp4",
  "https://a.top4top.io/m_3743581471.mp4",
  "https://c.top4top.io/m_3743uf75f1.mp4",
  "https://h.top4top.io/m_3743edepd1.mp4",
  "https://a.top4top.io/m_3743rrx0b1.mp4",
  "https://i.top4top.io/m_3743ag59l1.mp4",
  "https://h.top4top.io/m_3743lr1n71.mp4",
  "https://b.top4top.io/m_3743xuu201.mp4",
  "https://f.top4top.io/m_3743bu8mj1.mp4",
  "https://e.top4top.io/m_3743fjs401.mp4",
  "https://d.top4top.io/m_3743v1e5y1.mp4",
  "https://f.top4top.io/m_3743sxbum1.mp4",
  "https://i.top4top.io/m_3743269ub1.mp4"
];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  name: "Asupan Video",
  desc: "Mengambil URL video random asupan Tiktok/Reels yang keren dan aesthetic",
  category: "Random",
  path: "/api/asupan?apikey=",
  async run(req, res) {
    const { apikey, json } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({
        status: false,
        error: "Apikey tidak valid atau tidak diisi. Silakan gunakan apikey yang terdaftar."
      });
    }

    try {
      const video = random(asupanList);

      // Support return of raw JSON structure if explicitly requested
      if (json === 'true') {
        return res.status(200).json({
          status: true,
          result: {
            video
          }
        });
      }

      // Stream/buffer the video file directly to the client
      const response = await fetch(video, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://top4top.io/'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file video dari sumber asli (${response.status}): ${response.statusText}`);
      }

      // Set elegant video headers for buffering
      res.setHeader('Content-Type', 'video/mp4');
      
      // Mencegah browser melakukan caching agar video selalu random setiap di-refresh
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      // Fallback: If streaming fails, attempt to redirect the browser directly
      try {
        const fallbackVideo = random(asupanList);
        
        // Mencegah cache juga saat melakukan redirect
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.redirect(fallbackVideo);
      } catch (redirectErr) {
        return res.status(500).json({
          status: false,
          error: `Gagal memuat buffer video: ${err.message}`
        });
      }
    }
  }
};
