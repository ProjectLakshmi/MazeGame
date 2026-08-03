<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import playerSprite from '@/asset/player.png'
import enemySprite from '@/asset/enemy.png'
const canvasEl = ref(null)
let ctx = null

const CELL = 40
const SPRITE_SIZE = 32
const currentLevelIndex = ref(0)
const currentLevel = ref(null)
const player = ref({ row: 0, col: 0, facingLeft: false })
const enemy = ref(null)
let enemyIntervalId = null

const playerImg = new Image()
const enemyImg = new Image()
let imagesLoaded = 0

function loadImages(onAllLoaded) {
  const checkDone = () => {
    imagesLoaded++
    if (imagesLoaded === 2) onAllLoaded()
  }
  playerImg.onload = checkDone
  enemyImg.onload = checkDone
  playerImg.src = playerSprite
  enemyImg.src = enemySprite
}

const canvasWidth = computed(() =>
  currentLevel.value ? currentLevel.value.maze[0].length * CELL : 320
)
const canvasHeight = computed(() =>
  currentLevel.value ? currentLevel.value.maze.length * CELL : 320
)

function generateMaze(roomsWide, roomsHigh) {
  const width = roomsWide * 2 + 1
  const height = roomsHigh * 2 + 1

  const maze = []
  for (let r = 0; r < height; r++) {
    maze.push(new Array(width).fill(1))
  }

  const visited = []
  for (let r = 0; r < roomsHigh; r++) {
    visited.push(new Array(roomsWide).fill(false))
  }

  function carve(roomRow, roomCol) {
    visited[roomRow][roomCol] = true
    maze[roomRow * 2 + 1][roomCol * 2 + 1] = 0

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    directions.sort(() => Math.random() - 0.5)

    for (const [dRow, dCol] of directions) {
      const nextRow = roomRow + dRow
      const nextCol = roomCol + dCol
      const inBounds = nextRow >= 0 && nextRow < roomsHigh && nextCol >= 0 && nextCol < roomsWide
      if (inBounds && !visited[nextRow][nextCol]) {
        const wallRow = roomRow * 2 + 1 + dRow
        const wallCol = roomCol * 2 + 1 + dCol
        maze[wallRow][wallCol] = 0
        carve(nextRow, nextCol)
      }
    }
  }

  carve(0, 0)

  return {
    maze,
    start: { row: 1, col: 1 },
    exit: { row: height - 2, col: width - 2 },
  }
}

function findPath(maze, from, to) {
  const rows = maze.length
  const cols = maze[0].length
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false))
  const cameFrom = {}
  const queue = [from]
  visited[from.row][from.col] = true

  const key = (r, c) => r + ',' + c

  while (queue.length > 0) {
    const current = queue.shift()
    if (current.row === to.row && current.col === to.col) break

    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ]

    for (const n of neighbors) {
      const inBounds = n.row >= 0 && n.row < rows && n.col >= 0 && n.col < cols
      if (inBounds && maze[n.row][n.col] === 0 && !visited[n.row][n.col]) {
        visited[n.row][n.col] = true
        cameFrom[key(n.row, n.col)] = current
        queue.push(n)
      }
    }
  }

  const path = []
  let step = to
  while (step) {
    path.unshift(step)
    step = cameFrom[key(step.row, step.col)]
  }
  return path
}

function pickEnemyPatrol(level) {
  const path = findPath(level.maze, level.start, level.exit)
  return { path, pathIndex: 0, direction: 1 }
}

function loadLevel(index) {
  const roomsWide = 4 + index
  const roomsHigh = 4 + index
  const level = generateMaze(roomsWide, roomsHigh)

  currentLevel.value = level
  resetPositions(level)

  requestAnimationFrame(() => {
    canvasEl.value.width = canvasWidth.value
    canvasEl.value.height = canvasHeight.value
    drawMaze()
  })

  startEnemyLoop()
}

function resetPositions(level) {
  player.value = { row: level.start.row, col: level.start.col, facingLeft: false }
  const patrol = pickEnemyPatrol(level)
  enemy.value = {
    row: patrol.path[0].row,
    col: patrol.path[0].col,
    path: patrol.path,
    pathIndex: 0,
    direction: 1,
    facingLeft: false,
  }
}

function startEnemyLoop() {
  if (enemyIntervalId) clearInterval(enemyIntervalId)
  enemyIntervalId = setInterval(moveEnemy, 700)
}

function moveEnemy() {
  const e = enemy.value
  if (!e || e.path.length <= 1) return

  const prevCol = e.col
  e.pathIndex += e.direction
  if (e.pathIndex >= e.path.length) {
    e.pathIndex = e.path.length - 2
    e.direction = -1
  } else if (e.pathIndex < 0) {
    e.pathIndex = 1
    e.direction = 1
  }

  const step = e.path[e.pathIndex]
  e.row = step.row
  e.col = step.col
  if (e.col !== prevCol) e.facingLeft = e.col < prevCol

  drawMaze()
  checkEnemyCollision()
}

function checkEnemyCollision() {
  if (enemy.value.row === player.value.row && enemy.value.col === player.value.col) {
    alert('Caught! Restarting the level.')
    resetPositions(currentLevel.value)
    drawMaze()
  }
}

// Draws a sprite centered on a grid cell. Flips it horizontally when
// facing left, since drawImage() has no built-in "flip" option —
// scaling the canvas context by -1 on the x-axis is the standard trick.
function drawSprite(img, row, col, facingLeft) {
  const centerX = col * CELL + CELL / 2
  const centerY = row * CELL + CELL / 2
  const x = centerX - SPRITE_SIZE / 2
  const y = centerY - SPRITE_SIZE / 2

  ctx.save()
  if (facingLeft) {
    ctx.translate(centerX, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(img, -SPRITE_SIZE / 2, y, SPRITE_SIZE, SPRITE_SIZE)
  } else {
    ctx.drawImage(img, x, y, SPRITE_SIZE, SPRITE_SIZE)
  }
  ctx.restore()
}

function drawMaze() {
  const level = currentLevel.value

  for (let row = 0; row < level.maze.length; row++) {
    for (let col = 0; col < level.maze[row].length; col++) {
      ctx.fillStyle = level.maze[row][col] === 1 ? '#2a3340' : '#e8e8e8'
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL)
    }
  }

  ctx.fillStyle = 'green'
  ctx.fillRect(level.exit.col * CELL + 8, level.exit.row * CELL + 8, CELL - 16, CELL - 16)

  if (enemy.value) {
    drawSprite(enemyImg, enemy.value.row, enemy.value.col, enemy.value.facingLeft)
  }

  drawSprite(playerImg, player.value.row, player.value.col, player.value.facingLeft)
}

function tryMove(deltaRow, deltaCol) {
  const level = currentLevel.value
  const newRow = player.value.row + deltaRow
  const newCol = player.value.col + deltaCol

  if (level.maze[newRow] && level.maze[newRow][newCol] === 0) {
    if (deltaCol !== 0) player.value.facingLeft = deltaCol < 0

    player.value.row = newRow
    player.value.col = newCol
    drawMaze()
    checkEnemyCollision()

    if (player.value.row === level.exit.row && player.value.col === level.exit.col) {
      goToNextLevel()
    }
  }
}

function goToNextLevel() {
  currentLevelIndex.value++
  loadLevel(currentLevelIndex.value)
}

function handleKeydown(event) {
  if (event.key === 'ArrowUp') tryMove(-1, 0)
  else if (event.key === 'ArrowDown') tryMove(1, 0)
  else if (event.key === 'ArrowLeft') tryMove(0, -1)
  else if (event.key === 'ArrowRight') tryMove(0, 1)
}

onMounted(() => {
  ctx = canvasEl.value.getContext('2d')
  loadImages(() => {
    loadLevel(currentLevelIndex.value)
    window.addEventListener('keydown', handleKeydown)
  })
})

onUnmounted(() => {
  if (enemyIntervalId) clearInterval(enemyIntervalId)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <h2>Level {{ currentLevelIndex + 1 }}</h2>

  <div class="canvas-wrap">
    <canvas ref="canvasEl"></canvas>
  </div>

  <div class="touch-controls">
    <button @click="tryMove(-1, 0)" class="up">↑</button>
    <div class="middle-row">
      <button @click="tryMove(0, -1)" class="left">←</button>
      <button @click="tryMove(1, 0)" class="down">↓</button>
      <button @click="tryMove(0, 1)" class="right">→</button>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  display: flex;
  justify-content: center;
}
.canvas-wrap canvas {
  border: 2px solid black;
  max-width: 100%;
  height: auto;
}
.touch-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
.middle-row {
  display: flex;
  gap: 8px;
}
.touch-controls button {
  width: 56px;
  height: 56px;
  font-size: 24px;
  border-radius: 8px;
  border: 1px solid #2a3340;
  background: #e8e8e8;
  touch-action: manipulation;
}
</style>