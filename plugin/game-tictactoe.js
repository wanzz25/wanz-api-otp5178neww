const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] !== "_" && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  if (!board.includes("_")) return "draw";
  return null;
}

function minimax(board, player, ai) {
  const w = winner(board);
  if (w === ai) return { score: 1 };
  if (w && w !== "draw") return { score: -1 };
  if (w === "draw") return { score: 0 };

  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] !== "_") continue;
    const next = board.slice();
    next[i] = player;
    const result = minimax(next, player === "X" ? "O" : "X", ai);
    moves.push({ index: i, score: result.score });
  }

  if (player === ai) {
    return moves.reduce((best, m) => (m.score > best.score ? m : best));
  }
  return moves.reduce((best, m) => (m.score < best.score ? m : best));
}

module.exports = {
  name: "Tic-Tac-Toe AI",
  desc: "Hitung langkah terbaik (algoritma Minimax, tidak terkalahkan) untuk melawan papan Tic-Tac-Toe 3x3. Kirim board=9 sel dipisah koma (X,O,_ untuk kosong) dan ai=X atau O (giliran AI).",
  category: "Generator",
  path: "/api/game/tictactoe-ai?apikey=&board=X,O,_,_,X,_,_,_,_&ai=O",
  async run(req, res) {
    const { apikey, board, ai } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!board) {
      return res.status(400).json({ status: false, error: "Parameter 'board' wajib diisi, 9 sel dipisah koma (X,O,_)" });
    }
    const cells = String(board).split(",").map((c) => c.trim());
    if (cells.length !== 9 || cells.some((c) => !["X", "O", "_"].includes(c))) {
      return res.status(400).json({ status: false, error: "'board' harus 9 sel dipisah koma, isi X, O, atau _" });
    }
    const aiSide = ai === "X" || ai === "O" ? ai : "O";

    const already = winner(cells);
    if (already) {
      return res.status(200).json({ status: true, result: { finished: true, outcome: already } });
    }

    try {
      const best = minimax(cells, aiSide, aiSide);
      return res.status(200).json({ status: true, result: { finished: false, bestMove: best.index, evaluasi: best.score } });
    } catch (error) {
      console.error("Tic-Tac-Toe AI Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal menghitung langkah: " + String(error.message || error).slice(0, 300) });
    }
  }
};
