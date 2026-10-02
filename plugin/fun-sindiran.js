const SINDIR_LIST = [
  "Gak semua yang diam itu kalah, kadang cuma males ladenin orang yang gak penting.",
  "Lucu ya, yang paling sering baper duluan biasanya yang paling sering nyinggung orang.",
  "Kalau omongan kamu dipikirin semua, hidup kamu udah selesai dari kemarin.",
  "Sok sibuk padahal yang dikerjain cuma kepo hidup orang lain.",
  "Kadang diem itu bukan karena gak bisa jawab, tapi males buang energi ke orang yang gak level."
];

module.exports = {
  name: "Kata-kata Sindiran",
  desc: "Ambil 1 kalimat sindiran halus tapi pedas untuk status media sosial.",
  category: "Fun",
  path: "/api/fun/sindiran?apikey=",
  async run(req, res) {
    const { apikey } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const result = SINDIR_LIST[Math.floor(Math.random() * SINDIR_LIST.length)];
    return res.status(200).json({ status: true, result });
  }
};
