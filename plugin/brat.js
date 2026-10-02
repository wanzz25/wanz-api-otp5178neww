module.exports = {
  name: "Brat Generator",
  desc: "Membuat gambar sticker teks bergaya Brat aesthetic",
  category: "Image Creator",
  path: "/api/brat?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({
        status: false,
        error: "Apikey tidak valid. Silakan gunakan apikey yang terdaftar."
      });
    }

    if (!text) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'text' wajib diisi."
      });
    }

    try {
      const encodedText = encodeURIComponent(text);
      // Panggil API generator brat hf
      const buffer = await global.getBuffer(`https://aqul-brat.hf.space/?text=${encodedText}`);

      if (!buffer || buffer.length < 100) {
        return res.status(500).json({
          status: false,
          error: "Gagal memproses gambar atau data gambar korup."
        });
      }

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
      });
      res.end(buffer);

    } catch (e) {
      console.error('Brat API Error:', e.message);
      res.status(500).json({
        status: false,
        error: "Terjadi kesalahan saat menghubungi API Brat."
      });
    }
  }
};
