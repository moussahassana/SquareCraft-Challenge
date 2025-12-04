const grid = document.getElementById('grid');
const turnIndicator = document.getElementById('turnIndicator');
const message = document.getElementById('gameOverMessage');
const restartBtn = document.getElementById('restartBtn');
const setupModal = document.getElementById('setupModal');
const gameContainer = document.getElementById('gameContainer');
const startBtn = document.getElementById('startBtn');
const player1Input = document.getElementById('player1Input');
const player2Input = document.getElementById('player2Input');
const scoreBoard = document.getElementById('scoreBoard');

const size = 10;
let spacing = 40;
let currentPlayer = 'coral';
let playerNames = { coral: 'Player 1', azure: 'Player 2' };
let dots = new Map();
let scores = { coral: 0, azure: 0 };
let scoredSquares = new Set();
let lastDot = null;
let ghostDot = null;

const sounds = {
  click: null,
  score: null
};

function initSounds() {
  sounds.click = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
  sounds.score = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
}

function playSound(soundName) {
  if (sounds[soundName]) {
    try {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(() => {});
    } catch (e) {}
  }
}

function calculateSpacing() {
  if (!grid) return 40;
  const gridSize = grid.offsetWidth || 500;
  return gridSize / (size + 1);
}

function startGame() {
  const player1Name = (player1Input.value.trim() || 'Player 1').substring(0, 20);
  const player2Name = (player2Input.value.trim() || 'Player 2').substring(0, 20);

  playerNames.coral = player1Name;
  playerNames.azure = player2Name;

  setupModal.classList.add('hidden');
  gameContainer.classList.remove('hidden');

  spacing = calculateSpacing();
  initSounds();
  resetGame();
  window.addEventListener('resize', () => {
    const newSpacing = calculateSpacing();
    if (newSpacing !== spacing) {
      spacing = newSpacing;
      redrawGrid();
    }
  });
}

startBtn.addEventListener('click', startGame);

player1Input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

player2Input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

function key(x, y) {
  return `${x},${y}`;
}

function getColorStyle(player) {
  return player === 'coral' ? '#ff6b4a' : '#3b82f6';
}

function drawGridLines() {
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

function redrawGrid() {
  grid.innerHTML = '';
  drawGridLines();

  for (const [k, player] of dots.entries()) {
    const [x, y] = k.split(',').map(Number);
    const dot = document.createElement('div');
    dot.classList.add('dot', player);
    dot.style.left = `${x * spacing}px`;
    dot.style.top = `${y * spacing}px`;
    grid.appendChild(dot);
  }

  for (const squareKey of scoredSquares) {
    const [x, y] = squareKey.split(',').map(Number);
    const box = document.createElement('div');
    box.className = 'square-box';
    box.style.left = `${x * spacing}px`;
    box.style.top = `${y * spacing}px`;
    box.style.width = `${spacing}px`;
    box.style.height = `${spacing}px`;

    const ownerDots = [];
    for (let i = 0; i <= 1; i++) {
      for (let j = 0; j <= 1; j++) {
        const owner = dots.get(key(x + i, y + j));
        if (owner) ownerDots.push(owner);
      }
    }
    const owner = ownerDots[0];
    box.style.borderColor = getColorStyle(owner);
    grid.appendChild(box);

    const label = document.createElement('div');
    label.className = 'score-label';
    label.style.left = `${(x + 0.5) * spacing}px`;
    label.style.top = `${(y + 0.5) * spacing}px`;
    label.textContent = scores[owner];
    label.style.color = getColorStyle(owner);
    grid.appendChild(label);
  }
}

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
  const colorStyle = getColorStyle(player);
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
      playSound('score');

      const box = document.createElement('div');
      box.className = 'square-box';
      box.style.left = `${ax * spacing}px`;
      box.style.top = `${ay * spacing}px`;
      box.style.width = `${spacing}px`;
      box.style.height = `${spacing}px`;
      box.style.borderColor = colorStyle;
      grid.appendChild(box);

      const label = document.createElement('div');
      label.className = 'score-label';
      label.textContent = scores[player];
      label.style.left = `${(ax + 0.5) * spacing}px`;
      label.style.top = `${(ay + 0.5) * spacing}px`;
      label.style.color = colorStyle;
      grid.appendChild(label);

      drawAnimatedLine(ax * spacing, ay * spacing, bx * spacing, by * spacing, colorStyle);
      drawAnimatedLine(bx * spacing, by * spacing, dx2 * spacing, dy2 * spacing, colorStyle);
      drawAnimatedLine(dx2 * spacing, dy2 * spacing, cx * spacing, cy * spacing, colorStyle);
      drawAnimatedLine(cx * spacing, cy * spacing, ax * spacing, ay * spacing, colorStyle);
    }
  }
}

function updateScores() {
  scoreBoard.innerHTML = `${playerNames.coral}: <span style="color: #ff6b4a; font-weight: bold;">${scores.coral}</span> | ${playerNames.azure}: <span style="color: #3b82f6; font-weight: bold;">${scores.azure}</span>`;
}

function checkGameOver() {
  if (dots.size >= (size + 1) * (size + 1)) {
    let winner;
    if (scores.coral > scores.azure) winner = `${playerNames.coral} wins!`;
    else if (scores.azure > scores.coral) winner = `${playerNames.azure} wins!`;
    else winner = "It's a tie!";
    message.textContent = 'Game Over: ' + winner;
    message.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    grid.style.pointerEvents = 'none';
  }
}

function resetGame() {
  drawGridLines();
  updateScores();
  updateTurnIndicator();
}

function resetGameState() {
  grid.innerHTML = '';
  dots = new Map();
  scores = { coral: 0, azure: 0 };
  scoredSquares = new Set();
  message.classList.add('hidden');
  restartBtn.classList.add('hidden');
  grid.style.pointerEvents = 'auto';
  currentPlayer = 'coral';
  lastDot = null;
  resetGame();
}

function updateTurnIndicator() {
  const playerName = playerNames[currentPlayer];
  const color = currentPlayer === 'coral' ? '#ff6b4a' : '#3b82f6';
  turnIndicator.innerHTML = `<span style="color: ${color}; font-weight: bold;">${playerName}</span>'s Turn`;
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

  playSound('click');

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

  currentPlayer = currentPlayer === 'coral' ? 'azure' : 'coral';
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

  ghostDot.classList.remove('coral', 'azure', 'invalid');
  if (dots.has(k)) {
    ghostDot.classList.add('invalid');
  } else {
    ghostDot.classList.add(currentPlayer);
  }
}

grid.addEventListener('mousemove', (e) => {
  updateGhost(e.clientX, e.clientY);
});

grid.addEventListener('mouseleave', () => {
  ensureGhostDot();
  ghostDot.style.display = 'none';
});