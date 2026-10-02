const WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore " +
  "et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea " +
  "commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur " +
  "excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum").split(" ");

function randomSentence() {
  const len = 6 + Math.floor(Math.random() * 10);
  const words = Array.from({ length: len }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function randomParagraph() {
  const sentences = 4 + Math.floor(Math.random() * 4);
  return Array.from({ length: sentences }, randomSentence).join(" ");
}

module.exports = {
  name: "Lorem Ipsum Generator",
  desc: "Hasilkan teks dummy Lorem Ipsum. Atur jumlah paragraf lewat paragraphs (default 3, maks 20).",
  category: "Generator",
  path: "/api/tools/lorem-ipsum?apikey=&paragraphs=3",
  async run(req, res) {
    const { apikey, paragraphs } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const n = Math.min(20, Math.max(1, parseInt(paragraphs, 10) || 3));

    try {
      const result = Array.from({ length: n }, randomParagraph);
      return res.status(200).json({ status: true, paragraphs: n, result });
    } catch (error) {
      console.error("Lorem Ipsum Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal memproses: " + String(error.message || error).slice(0, 300) });
    }
  }
};
