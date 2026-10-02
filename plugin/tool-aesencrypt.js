const crypto = require("crypto");

function deriveKey(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest();
}

module.exports = {
  name: "AES Encrypt",
  desc: "Enkripsi teks dengan AES-256-CBC. Kembalikan ciphertext dalam format IV:HEX (IV digabung di depan, dipisah titik dua).",
  category: "Encoding",
  path: "/api/tools/aes-encrypt?apikey=&text=&secret=",
  async run(req, res) {
    const { apikey, text, secret } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text || !secret) {
      return res.status(400).json({ status: false, error: "Parameter 'text' dan 'secret' wajib diisi" });
    }

    try {
      const key = deriveKey(secret);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
      const result = iv.toString("hex") + ":" + encrypted.toString("hex");
      return res.status(200).json({ status: true, result });
    } catch (error) {
      console.error("AES Encrypt Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal enkripsi: " + String(error.message || error).slice(0, 300) });
    }
  }
};
