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
const gridSizeSelect = document.getElementById('gridSizeSelect');
const player1ColorInput = document.getElementById('player1Color');
const player2ColorInput = document.getElementById('player2Color');
const gridLength = document.getElementById('gridLength');

let size = 15;
let spacing = 40;
let currentPlayer = 'player1';
let playerNames = { player1: 'Player 1', player2: 'Player 2' };
let playerColors = { player1: '#ff6b4a', player2: '#3b82f6' };
let dots = new Map();
let scores = { player1: 0, player2: 0 };
let scoredSquares = new Set();
let lastDot = null;
let ghostDot = null;

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  const gridSize = grid.clientWidth || 400;
  return gridSize / size;
}

function startGame() {
  const player1Name = (player1Input.value.trim() || 'Player 1').substring(0, 20);
  const player2Name = (player2Input.value.trim() || 'Player 2').substring(0, 20);

  playerNames.player1 = player1Name;
  playerNames.player2 = player2Name;
  
  playerColors.player1 = player1ColorInput.value;
  playerColors.player2 = player2ColorInput.value;
  
  size = parseInt(gridSizeSelect.value, 10);
  gridLength.textContent = `Grid: ${size} × ${size}`;

  setupModal.classList.add('hidden');
  gameContainer.classList.remove('hidden');

  // Force a reflow to ensure the container is visible and has dimensions
  void gameContainer.offsetHeight;

  // Ensure DOM has updated before calculating spacing and drawing
  requestAnimationFrame(() => {
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
  });
}

startBtn.addEventListener('click', startGame);

player1Input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') player2Input.focus();
});

player2Input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

function key(x, y) {
  return `${x},${y}`;
}

function getColorStyle(player) {
  return playerColors[player];
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

function redrawGrid() {
  grid.innerHTML = '';
  drawGridLines();

  for (const [k, player] of dots.entries()) {
    const [x, y] = k.split(',').map(Number);
    const dot = document.createElement('div');
    dot.classList.add('dot');
    dot.style.backgroundColor = playerColors[player];
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
  scoreBoard.innerHTML = `${playerNames.player1}: <span style="color: ${playerColors.player1}; font-weight: bold;">${scores.player1}</span> | ${playerNames.player2}: <span style="color: ${playerColors.player2}; font-weight: bold;">${scores.player2}</span>`;
}

function updateTurnIndicator() {
  const colorStyle = getColorStyle(currentPlayer);
  turnIndicator.innerHTML = `Current Turn: <span style="color: ${colorStyle}; font-weight: bold;">${playerNames[currentPlayer]}</span>`;
}

function checkGameOver() {
  if (dots.size >= (size + 1) * (size + 1)) {
    let winner;
    if (scores.player1 > scores.player2) winner = `${playerNames.player1} wins!`;
    else if (scores.player2 > scores.player1) winner = `${playerNames.player2} wins!`;
    else winner = "It's a tie!";
    message.textContent = '🎮 Game Over: ' + winner;
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
  scores = { player1: 0, player2: 0 };
  scoredSquares = new Set();
  message.classList.add('hidden');
  restartBtn.classList.add('hidden');
  grid.style.pointerEvents = 'auto';
  currentPlayer = 'player1';
  lastDot = null;
  resetGame();
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
  dot.classList.add('dot', 'highlight');
  dot.style.backgroundColor = playerColors[currentPlayer];
  dot.style.left = `${x * spacing}px`;
  dot.style.top = `${y * spacing}px`;
  dot.style.transform = 'translate(-50%, -50%) scale(0.85)';
  grid.appendChild(dot);
  requestAnimationFrame(() => {
    dot.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  lastDot = dot;

  dots.set(k, currentPlayer);
  playSound('click');

  checkSquare(x, y, currentPlayer);
  checkGameOver();

  currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
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
  const color = getColorStyle(currentPlayer);
  ghostDot.style.borderColor = color;
  if (dots.has(k)) {
    ghostDot.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    ghostDot.style.borderColor = '#ef4444';
  } else {
    ghostDot.style.backgroundColor = hexToRgba(color, 0.1);
  }
}

grid.addEventListener('mousemove', (e) => {
  updateGhost(e.clientX, e.clientY);
});

grid.addEventListener('mouseleave', () => {
  if (ghostDot) ghostDot.style.display = 'none';
});
