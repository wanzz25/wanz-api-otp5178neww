const axios = require("axios");

module.exports = {
  name: "GitHub Repo ZIP Link",
  desc: "Buat direct link ZIP source code sebuah repo GitHub. Kirim owner dan repo.",
  category: "Downloader",
  path: "/api/dl/github-clone?apikey=&owner=nodejs&repo=node",
  async run(req, res) {
    const { apikey, owner, repo } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!owner || !repo) {
      return res.status(400).json({ status: false, error: "Parameter 'owner' dan 'repo' wajib diisi" });
    }
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const branch = response.data.default_branch;
      const zipUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`;
      return res.status(200).json({
        status: true,
        result: { owner, repo, defaultBranch: branch, stars: response.data.stargazers_count, zipUrl }
      });
    } catch (error) {
      console.error("GitHub Repo ZIP Link Error:", error.message);
      return res.status(500).json({
        status: false,
        error: "Gagal mengambil data: " + String(error.message || error).slice(0, 300)
      });
    }
  }
};
