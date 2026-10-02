function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeSolvedBoard() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function isValid(r, c, v) {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === v || board[i][c] === v) return false;
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[br + i][bc + j] === v) return false;
      }
    }
    return true;
  }

  function fill(pos) {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9), c = pos % 9;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const v of nums) {
      if (isValid(r, c, v)) {
        board[r][c] = v;
        if (fill(pos + 1)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }

  fill(0);
  return board;
}

const HOLES = { easy: 35, medium: 45, hard: 52, extreme: 58 };

function makePuzzle(solved, difficulty) {
  const puzzle = solved.map((row) => row.slice());
  const holes = HOLES[difficulty] || HOLES.medium;
  const cells = shuffle(Array.from({ length: 81 }, (_, i) => i)).slice(0, holes);
  for (const idx of cells) {
    puzzle[Math.floor(idx / 9)][idx % 9] = 0;
  }
  return puzzle;
}

module.exports = {
  name: "Sudoku Generator",
  desc: "Buat papan puzzle Sudoku 9x9 acak beserta solusinya. Atur difficulty=easy|medium|hard|extreme (default medium).",
  category: "Generator",
  path: "/api/game/sudoku-generator?apikey=&difficulty=medium",
  async run(req, res) {
    const { apikey, difficulty } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    const diff = ["easy", "medium", "hard", "extreme"].includes(difficulty) ? difficulty : "medium";

    try {
      const solution = makeSolvedBoard();
      const puzzle = makePuzzle(solution, diff);
      return res.status(200).json({ status: true, difficulty: diff, result: { puzzle, solution } });
    } catch (error) {
      console.error("Sudoku Generator Error:", error.message);
      return res.status(500).json({ status: false, error: "Gagal membuat sudoku: " + String(error.message || error).slice(0, 300) });
    }
  }
};
