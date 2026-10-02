const crypto = require("crypto");

function deriveKey(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest();
}

module.exports = {
  name: "AES Decrypt",
  desc: "Dekripsi ciphertext AES-256-CBC (format IV:HEX) hasil dari /api/tools/aes-encrypt, memakai secret yang sama.",
  category: "Encoding",
  path: "/api/tools/aes-decrypt?apikey=&cipher=&secret=",
  async run(req, res) {
    const { apikey, cipher, secret } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!cipher || !secret) {
      return res.status(400).json({ status: false, error: "Parameter 'cipher' dan 'secret' wajib diisi" });
    }

    const parts = String(cipher).split(":");
    if (parts.length !== 2 || !/^[0-9a-fA-F]+$/.test(parts[0]) || !/^[0-9a-fA-F]+$/.test(parts[1])) {
      return res.status(400).json({ status: false, error: "Format 'cipher' harus IV:HEX (hasil dari aes-encrypt)" });
    }

    try {
      const key = deriveKey(secret);
      const iv = Buffer.from(parts[0], "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      const decrypted = Buffer.concat([decipher.update(Buffer.from(parts[1], "hex")), decipher.final()]);
      return res.status(200).json({ status: true, result: decrypted.toString("utf8") });
    } catch (error) {
      return res.status(400).json({ status: false, error: "Gagal dekripsi: secret salah atau ciphertext tidak valid" });
    }
  }
};
