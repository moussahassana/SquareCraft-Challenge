const grid = document.getElementById('grid');
const turnIndicator = document.getElementById('turnIndicator');
const scoreBoard = document.getElementById('scoreBoard');
const message = document.getElementById('gameOverMessage');
const restartBtn = document.getElementById('restartBtn');
const setupModal = document.getElementById('setupModal');
const gameContainer = document.getElementById('gameContainer');
const startBtn = document.getElementById('startBtn');
const player1Input = document.getElementById('player1Input');
const player2Input = document.getElementById('player2Input');

const size = 10;
let spacing = 40;
let currentPlayer = 'red';
let playerNames = { red: 'Player 1', blue: 'Player 2' };
let dots = new Map();
let scores = { red: 0, blue: 0 };
let scoredSquares = new Set();
let lastDot = null;
let ghostDot = null;

function key(x, y) {
  return `${x},${y}`;
}

function calculateSpacing() {
  // If grid has a fixed width in CSS, use it. Otherwise calculate.
  const gridWidth = grid.clientWidth || 400;
  return gridWidth / size;
}

function drawGridLines() {
  grid.innerHTML = '';
  for (let i = 0; i <= size; i++) {
    const hLine = document.createElement('div');
    hLine.classList.add('grid-line', 'horizontal');
    hLine.style.top = `${i * spacing}px`;
    grid.appendChild(hLine);

    const vLine = document.createElement('div');
    vLine.classList.add('grid-line', 'vertical');
    vLine.style.left = `${i * spacing}px`;
    grid.appendChild(vLine);
  }
}

function startGame() {
  const p1 = player1Input.value.trim() || 'Player 1';
  const p2 = player2Input.value.trim() || 'Player 2';
  playerNames.red = p1;
  playerNames.blue = p2;

  setupModal.classList.add('hidden');
  gameContainer.classList.remove('hidden');

  // Force a reflow to ensure the container is visible and has dimensions
  void gameContainer.offsetHeight;

  // Ensure DOM has updated before calculating spacing and drawing
  requestAnimationFrame(() => {
    spacing = calculateSpacing();
    resetGameState();
  });
}

startBtn.addEventListener('click', startGame);

player1Input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') player2Input.focus();
});

player2Input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

function drawAnimatedLine(x1, y1, x2, y2, color) {
  const line = document.createElement('div');
  line.className = 'score-line';
  line.style.backgroundColor = color;

  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${angle}deg) scaleX(0)`;

  grid.appendChild(line);

  requestAnimationFrame(() => {
    line.style.transform = `rotate(${angle}deg) scaleX(1)`;
  });
}

function checkSquare(x, y, player) {
  const color = player === 'red' ? 'red' : 'blue';
  const offsets = [
    [0, 0], [-1, 0], [0, -1], [-1, -1]
  ];

  for (const [dx, dy] of offsets) {
    const ax = x + dx, ay = y + dy;
    const bx = ax + 1, by = ay;
    const cx = ax, cy = ay + 1;
    const dx2 = ax + 1, dy2 = ay + 1;
    const squareKey = `${ax},${ay}`;

    if (
      ax >= 0 && ay >= 0 && bx <= size && dy2 <= size &&
      dots.get(key(ax, ay)) === player &&
      dots.get(key(bx, by)) === player &&
      dots.get(key(cx, cy)) === player &&
      dots.get(key(dx2, dy2)) === player &&
      !scoredSquares.has(squareKey)
    ) {
      scoredSquares.add(squareKey);
      scores[player]++;
      updateScores();

      const box = document.createElement('div');
      box.className = 'square-box';
      box.style.left = `${ax * spacing}px`;
      box.style.top = `${ay * spacing}px`;
      box.style.width = `${spacing}px`;
      box.style.height = `${spacing}px`;
      box.style.borderColor = color;
      grid.appendChild(box);

      const label = document.createElement('div');
      label.className = 'score-label';
      label.textContent = scores[player];
      label.style.left = `${(ax + 0.5) * spacing}px`;
      label.style.top = `${(ay + 0.5) * spacing}px`;
      label.style.color = color;
      grid.appendChild(label);

      drawAnimatedLine(ax * spacing, ay * spacing, bx * spacing, by * spacing, color);
      drawAnimatedLine(bx * spacing, by * spacing, dx2 * spacing, dy2 * spacing, color);
      drawAnimatedLine(dx2 * spacing, dy2 * spacing, cx * spacing, cy * spacing, color);
      drawAnimatedLine(cx * spacing, cy * spacing, ax * spacing, ay * spacing, color);
    }
  }
}

function updateScores() {
  scoreBoard.innerHTML = `${playerNames.red}: <span class="font-bold text-red-500">${scores.red}</span> | ${playerNames.blue}: <span class="font-bold text-blue-500">${scores.blue}</span>`;
}

function updateTurnIndicator() {
  const colorClass = currentPlayer === 'red' ? 'text-red-500' : 'text-blue-500';
  turnIndicator.innerHTML = `Current Turn: <span class="font-bold ${colorClass}">${playerNames[currentPlayer]}</span>`;
}

function checkGameOver() {
  if (dots.size >= (size + 1) * (size + 1)) {
    let winner;
    if (scores.red > scores.blue) winner = `${playerNames.red} wins!`;
    else if (scores.blue > scores.red) winner = `${playerNames.blue} wins!`;
    else winner = "It's a tie!";
    message.textContent = '🎮 Game Over: ' + winner;
    message.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    grid.style.pointerEvents = 'none';
  }
}

function resetGameState() {
  grid.innerHTML = '';
  dots = new Map();
  scores = { red: 0, blue: 0 };
  scoredSquares = new Set();
  message.classList.add('hidden');
  restartBtn.classList.add('hidden');
  grid.style.pointerEvents = 'auto';
  currentPlayer = 'red';
  lastDot = null;
  drawGridLines();
  updateScores();
  updateTurnIndicator();
}

restartBtn.addEventListener('click', resetGameState);

grid.addEventListener('click', (e) => {
  const rect = grid.getBoundingClientRect();
  const x = Math.round((e.clientX - rect.left) / spacing);
  const y = Math.round((e.clientY - rect.top) / spacing);
  if (x < 0 || x > size || y < 0 || y > size) return;
  const k = key(x, y);
  if (dots.has(k)) return;

  if (lastDot) lastDot.classList.remove('highlight');

  const dot = document.createElement('div');
  dot.classList.add('dot', currentPlayer, 'highlight');
  dot.style.left = `${x * spacing}px`;
  dot.style.top = `${y * spacing}px`;
  dot.style.transform = 'translate(-50%, -50%) scale(0.85)';
  grid.appendChild(dot);
  requestAnimationFrame(() => {
    dot.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  lastDot = dot;

  dots.set(k, currentPlayer);

  checkSquare(x, y, currentPlayer);
  checkGameOver();

  currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
  updateTurnIndicator();
});

function ensureGhostDot() {
  if (!ghostDot) {
    ghostDot = document.createElement('div');
    ghostDot.className = 'ghost-dot';
    ghostDot.style.display = 'none';
    grid.appendChild(ghostDot);
  }
}

function updateGhost(clientX, clientY) {
  ensureGhostDot();
  const rect = grid.getBoundingClientRect();
  const x = Math.round((clientX - rect.left) / spacing);
  const y = Math.round((clientY - rect.top) / spacing);
  if (x < 0 || x > size || y < 0 || y > size) {
    ghostDot.style.display = 'none';
    return;
  }
  const k = key(x, y);
  ghostDot.style.display = 'block';
  ghostDot.style.left = `${x * spacing}px`;
  ghostDot.style.top = `${y * spacing}px`;
  ghostDot.style.borderColor = currentPlayer === 'red' ? 'red' : 'blue';
  if (dots.has(k)) {
    ghostDot.classList.add('invalid');
  } else {
    ghostDot.classList.remove('invalid');
  }
}

grid.addEventListener('mousemove', (e) => {
  updateGhost(e.clientX, e.clientY);
});

grid.addEventListener('mouseleave', () => {
  if (ghostDot) ghostDot.style.display = 'none';
});
