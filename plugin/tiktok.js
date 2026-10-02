const axios = require("axios");

async function tiktokDl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      function formatNumber(integer) {
        let numb = parseInt(integer);
        return Number(numb).toLocaleString().replace(/,/g, '.');
      }

      function formatDate(n, locale = "en") {
        let d = new Date(n * 1000);
        return d.toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        });
      }

      const { data } = await axios.post(
        "https://www.tikwm.com/api/",
        {},
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Origin: "https://www.tikwm.com",
            Referer: "https://www.tikwm.com/",
            "User-Agent": "Mozilla/5.0",
            "X-Requested-With": "XMLHttpRequest"
          },
          params: {
            url,
            count: 12,
            cursor: 0,
            web: 1,
            hd: 1
          }
        }
      );

      const res = data.data;
      if (!res) return reject("Data kosong");

      let media = [];

      if (Array.isArray(res.images) && res.images.length > 0) {
        res.images.forEach(v => {
          media.push({
            type: "photo",
            url: v.startsWith("http") ? v : `https://www.tikwm.com${v}`
          });
        });
      } else {
        media.push(
          { type: "watermark", url: "https://www.tikwm.com" + res.wmplay },
          { type: "nowatermark", url: "https://www.tikwm.com" + res.play },
          { type: "nowatermark_hd", url: "https://www.tikwm.com" + res.hdplay }
        );
      }

      resolve({
        status: true,
        title: res.title,
        taken_at: formatDate(res.create_time),
        region: res.region,
        id: res.id,
        durations: res.duration,
        duration: res.duration + " Seconds",
        cover: "https://www.tikwm.com" + res.cover,
        data: media,
        music_info: {
          id: res.music_info.id,
          title: res.music_info.title,
          author: res.music_info.author,
          album: res.music_info.album || null,
          url: "https://www.tikwm.com" + (res.music || res.music_info.play)
        },
        stats: {
          views: formatNumber(res.play_count),
          likes: formatNumber(res.digg_count),
          comment: formatNumber(res.comment_count),
          share: formatNumber(res.share_count),
          download: formatNumber(res.download_count)
        },
        author: {
          id: res.author.id,
          fullname: res.author.unique_id,
          nickname: res.author.nickname,
          avatar: "https://www.tikwm.com" + res.author.avatar
        }
      });
    } catch (e) {
      reject(e.message);
    }
  });
}

module.exports = {
  name: "Tiktok Downloader",
  desc: "Download video atau slideshow Tiktok tanpa watermark.",
  category: "Downloader",
  path: "/api/download/tiktok?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const result = await tiktokDl(url);
      return res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        error: error
      });
    }
  }
};
