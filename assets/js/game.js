const grid = document.getElementById('grid');
const turnIndicator = document.getElementById('turnIndicator');
const redScoreDisplay = document.getElementById('redScore');
const blueScoreDisplay = document.getElementById('blueScore');
const message = document.getElementById('gameOverMessage');
const restartBtn = document.getElementById('restartBtn');

const size = 10;
const spacing = 40;
let currentPlayer = 'red';
let dots = new Map();
let scores = { red: 0, blue: 0 };
let scoredSquares = new Set();
let lastDot = null;

function key(x, y) {
  return `${x},${y}`;
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

drawGridLines();

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
  const color = player;
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
  redScoreDisplay.textContent = scores.red;
  blueScoreDisplay.textContent = scores.blue;
}

function checkGameOver() {
  if (dots.size >= (size + 1) * (size + 1)) {
    let winner;
    if (scores.red > scores.blue) winner = 'Red wins!';
    else if (scores.blue > scores.red) winner = 'Blue wins!';
    else winner = "It's a tie!";
    message.textContent = '🎮 Game Over: ' + winner;
    message.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    grid.style.pointerEvents = 'none';
  }
}

restartBtn.addEventListener('click', () => {
  grid.innerHTML = '';
  dots = new Map();
  scores = { red: 0, blue: 0 };
  scoredSquares = new Set();
  message.classList.add('hidden');
  restartBtn.classList.add('hidden');
  grid.style.pointerEvents = 'auto';
  redScoreDisplay.textContent = '0';
  blueScoreDisplay.textContent = '0';
  currentPlayer = 'red';
  lastDot = null;
  turnIndicator.innerHTML = 'Current Turn: <span class="font-bold text-red-500">Red</span>';
  drawGridLines();
});

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
  grid.appendChild(dot);
  lastDot = dot;

  dots.set(k, currentPlayer);

  checkSquare(x, y, currentPlayer);
  checkGameOver();

  currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
  turnIndicator.innerHTML = `Current Turn: <span class="font-bold text-${currentPlayer}-500">${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}</span>`;
});