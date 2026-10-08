// Maze Runner 2.0 — procedural maze with minimap
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');
const MSG = document.getElementById('message');

const TILE = 20;
let COLS, ROWS;
let maze = [];
let player = { x: 0, y: 0 };
let exitPos = { x: 0, y: 0 };
let level = 1;
let deaths = 0;
let startTime = Date.now();
let animFrame;

function resize() {
  COLS = Math.floor((window.innerWidth - 40) / TILE);
  ROWS = Math.floor((window.innerHeight - 120) / TILE);
  if (COLS < 7) COLS = 7;
  if (ROWS < 7) ROWS = 7;
  // Ensure odd dimensions for maze gen
  if (COLS % 2 === 0) COLS--;
  if (ROWS % 2 === 0) ROWS--;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  const mmScale = Math.floor(150 / Math.max(COLS, ROWS));
  mmCanvas.width = COLS * mmScale;
  mmCanvas.height = ROWS * mmScale;
}

// Recursive backtracker maze generation
function generateMaze() {
  maze = [];
  for (let y = 0; y < ROWS; y++) {
    maze[y] = [];
    for (let x = 0; x < COLS; x++) {
      maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
    }
  }
  const stack = [];
  let current = { x: 1, y: 1 };
  maze[1][1].visited = true;
  stack.push(current);

  while (stack.length > 0) {
    const neighbors = getUnvisitedNeighbors(current);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      maze[next.y][next.x].visited = true;
      stack.push(current);
      current = next;
    } else {
      current = stack.pop();
    }
  }
}

function getUnvisitedNeighbors(cell) {
  const { x, y } = cell;
  const result = [];
  if (y > 1 && !maze[y - 2][x].visited) result.push({ x, y: y - 2 });
  if (x < COLS - 2 && !maze[y][x + 2].visited) result.push({ x: x + 2, y });
  if (y < ROWS - 2 && !maze[y + 2][x].visited) result.push({ x, y: y + 2 });
  if (x > 1 && !maze[y][x - 2].visited) result.push({ x: x - 2, y });
  return result;
}

function removeWall(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 2) { maze[a.y][a.x + 1].left = false; maze[b.y][b.x].right = false; }
  else if (dx === -2) { maze[a.y][a.x].left = false; maze[b.y][b.x].right = false; }
  else if (dy === 2) { maze[a.y][a.x].top = false; maze[b.y][b.x].bottom = false; }
  else if (dy === -2) { maze[a.y][a.x].bottom = false; maze[b.y][b.x].top = false; }
}

function initLevel() {
  resize();
  generateMaze();
  player = { x: 1, y: 1 };
  exitPos = { x: COLS - 2, y: ROWS - 2 };
  MSG.style.display = 'none';
  startTime = Date.now();
}

function draw() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw maze walls
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 1;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = maze[y][x];
      const px = x * TILE, py = y * TILE;
      if (tile.top) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE, py); ctx.stroke(); }
      if (tile.right) { ctx.beginPath(); ctx.moveTo(px + TILE, py); ctx.lineTo(px + TILE, py + TILE); ctx.stroke(); }
      if (tile.bottom) { ctx.beginPath(); ctx.moveTo(px, py + TILE); ctx.lineTo(px + TILE, py + TILE); ctx.stroke(); }
      if (tile.left) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + TILE); ctx.stroke(); }
    }
  }

  // Draw exit
  ctx.fillStyle = '#0f0';
  ctx.fillRect(exitPos.x * TILE + 4, exitPos.y * TILE + 4, TILE - 8, TILE - 8);

  // Draw player
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(player.x * TILE + TILE / 2, player.y * TILE + TILE / 2, TILE / 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw minimap
  const ms = Math.floor(150 / Math.max(COLS, ROWS));
  mmCtx.fillStyle = '#0a0a1a';
  mmCtx.fillRect(0, 0, mmCanvas.width, mmCanvas.height);
  mmCtx.strokeStyle = '#040';
  mmCtx.lineWidth = 0.5;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = maze[y][x];
      const px = x * ms, py = y * ms;
      if (tile.top) { mmCtx.beginPath(); mmCtx.moveTo(px, py); mmCtx.lineTo(px + ms, py); mmCtx.stroke(); }
      if (tile.right) { mmCtx.beginPath(); mmCtx.moveTo(px + ms, py); mmCtx.lineTo(px + ms, py + ms); mmCtx.stroke(); }
      if (tile.bottom) { mmCtx.beginPath(); mmCtx.moveTo(px, py + ms); mmCtx.lineTo(px + ms, py + ms); mmCtx.stroke(); }
      if (tile.left) { mmCtx.beginPath(); mmCtx.moveTo(px, py); mmCtx.lineTo(px, py + ms); mmCtx.stroke(); }
    }
  }
  mmCtx.fillStyle = '#0f0';
  mmCtx.fillRect(exitPos.x * ms, exitPos.y * ms, ms, ms);
  mmCtx.fillStyle = '#ff0';
  mmCtx.beginPath();
  mmCtx.arc(player.x * ms + ms / 2, player.y * ms + ms / 2, ms / 2, 0, Math.PI * 2);
  mmCtx.fill();

  // Update UI
  document.getElementById('level').textContent = level;
  document.getElementById('time').textContent = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('deaths').textContent = deaths;

  animFrame = requestAnimationFrame(draw);
}

function movePlayer(dx, dy) {
  const nx = player.x + dx, ny = player.y + dy;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;

  // Check walls
  const tile = maze[player.y][player.x];
  if (dx === 1 && tile.right) return;
  if (dx === -1 && tile.left) return;
  if (dy === 1 && tile.bottom) return;
  if (dy === -1 && tile.top) return;

  player.x = nx;
  player.y = ny;

  // Check exit
  if (nx === exitPos.x && ny === exitPos.y) {
    level++;
    MSG.textContent = 'Level ' + (level - 1) + ' cleared!';
    MSG.style.display = 'block';
    setTimeout(() => {
      MSG.style.display = 'none';
      initLevel();
    }, 800);
  }
}

// Input
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); break;
    case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); break;
    case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); break;
    case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); break;
  }
});

window.addEventListener('keyup', e => { keys[e.key] = false; });
window.addEventListener('resize', () => {
  if (animFrame) cancelAnimationFrame(animFrame);
  initLevel();
  draw();
});

// Init
initLevel();
draw();
