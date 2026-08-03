import { ref, computed } from 'vue'
import playerSprite from '@/asset/player.png'
import enemySprite from '@/asset/enemy.png'

export function useMazeGame() {
  let ctx = null
  const canvasEl = ref(null)

  const CELL = 40
  const SPRITE_SIZE = 32
  const currentLevelIndex = ref(0)
  const currentLevel = ref(null)
  const player = ref({ row: 0, col: 0, facingLeft: false })
  const enemy = ref(null)
  const floodPercent = ref(0)
  const caughtMessage = ref('')
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

  // ---------- Maze generation ----------
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

  function collectFloorCells(maze) {
    const cells = []
    for (let r = 0; r < maze.length; r++) {
      for (let c = 0; c < maze[r].length; c++) {
        if (maze[r][c] === 0) cells.push({ row: r, col: c })
      }
    }
    return cells
  }

  // The maze is a perfect maze (no loops), so there is exactly one route
  // between any two cells. If the guardian patrolled start->exit directly it
  // would always occupy the player's only path with no way around it. Instead
  // it patrols a random stretch of corridor, so it may or may not overlap the
  // critical path, and the player gets real chances to time a dodge.
  function pickEnemyPatrol(level) {
    const floorCells = collectFloorCells(level.maze)
    let path = []
    let attempts = 0
    while (path.length < 4 && attempts < 20) {
      const a = floorCells[Math.floor(Math.random() * floorCells.length)]
      const b = floorCells[Math.floor(Math.random() * floorCells.length)]
      path = findPath(level.maze, a, b)
      attempts++
    }
    if (path.length < 2) path = findPath(level.maze, level.start, level.exit)
    return { path, pathIndex: 0, direction: 1 }
  }

  // ---------- Flood mechanic ----------
  // Water rises from the bottom of the maze (near the exit) toward the top.
  // Each level it rises faster, so later levels demand a faster escape.
  // A short grace period at level start gives the player time to get moving
  // before the water starts climbing.
  const FLOOD_START_DELAY_MS = 2500
  const BASE_RISE_MS_PER_ROW = 2600
  const MIN_RISE_MS_PER_ROW = 1000
  let levelStartTime = 0
  let invulnerableUntil = 0

  function riseMsPerRow() {
    return Math.max(MIN_RISE_MS_PER_ROW, BASE_RISE_MS_PER_ROW - currentLevelIndex.value * 70)
  }

  // Returns a fractional row index: rows <= this value are underwater.
  // The flood rises from the start side (top) toward the exit (bottom), so
  // it pressures forward progress instead of drowning the goal first.
  function floodFrontRow(level, timestamp) {
    const elapsed = Math.max(0, timestamp - levelStartTime - FLOOD_START_DELAY_MS)
    return -1 + elapsed / riseMsPerRow()
  }

  function triggerCaught(reason, timestamp) {
    if (timestamp < invulnerableUntil) return
    invulnerableUntil = timestamp + 900
    caughtMessage.value = reason === 'flood' ? 'Swallowed by the flood' : 'Spotted by the guardian'
    resetPositions(currentLevel.value)
    levelStartTime = timestamp
    setTimeout(() => {
      caughtMessage.value = ''
    }, 1100)
  }

  // ---------- Level lifecycle ----------
  function loadLevel(index) {
    const roomsWide = 4 + index
    const roomsHigh = 4 + index
    const level = generateMaze(roomsWide, roomsHigh)

    currentLevel.value = level
    resetPositions(level)
    levelStartTime = performance.now()
    invulnerableUntil = 0
    floodPercent.value = 0

    requestAnimationFrame(() => {
      canvasEl.value.width = canvasWidth.value
      canvasEl.value.height = canvasHeight.value
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
    const speed = Math.max(320, 700 - currentLevelIndex.value * 40)
    enemyIntervalId = setInterval(moveEnemy, speed)
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

    if (e.row === player.value.row && e.col === player.value.col) {
      triggerCaught('guardian', performance.now())
    }
  }

  // ---------- Rendering ----------
  function drawSprite(img, row, col, facingLeft, glowColor, timestamp) {
    const centerX = col * CELL + CELL / 2
    const centerY = row * CELL + CELL / 2
    const x = centerX - SPRITE_SIZE / 2
    const y = centerY - SPRITE_SIZE / 2
    const pulse = 8 + Math.sin(timestamp / 220) * 4

    ctx.save()
    ctx.globalAlpha = 0.28
    ctx.shadowColor = glowColor
    ctx.shadowBlur = pulse + 6
    ctx.fillStyle = glowColor
    ctx.beginPath()
    ctx.arc(centerX, centerY, SPRITE_SIZE / 2 + pulse / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

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

  // Draws the glowing edge on every wall cell. brightness > 1 is used to punch
  // the outline back through the translucent flood overlay so paths stay readable
  // even once that part of the maze is underwater.
  function drawWallEdges(timestamp, brightness) {
    const level = currentLevel.value
    for (let row = 0; row < level.maze.length; row++) {
      for (let col = 0; col < level.maze[row].length; col++) {
        if (level.maze[row][col] !== 1) continue
        const x = col * CELL
        const y = row * CELL
        const flicker = 0.35 + Math.abs(Math.sin(timestamp / 900 + row * 3 + col * 7)) * 0.2
        ctx.strokeStyle = `rgba(45, 245, 201, ${Math.min(1, flicker * brightness)})`
        ctx.lineWidth = 2
        ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
      }
    }
  }

  function drawMaze(timestamp) {
    const level = currentLevel.value
    if (!level || !ctx) return

    ctx.fillStyle = '#0a0e14'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

    for (let row = 0; row < level.maze.length; row++) {
      for (let col = 0; col < level.maze[row].length; col++) {
        const x = col * CELL
        const y = row * CELL
        if (level.maze[row][col] === 1) {
          // Walls: near-black block, so they read as solid mass at a glance.
          ctx.fillStyle = '#04070a'
          ctx.fillRect(x, y, CELL, CELL)
        } else {
          // Floor: clearly lighter slate, with a faint dot to suggest open ground.
          ctx.fillStyle = '#232f42'
          ctx.fillRect(x, y, CELL, CELL)
          ctx.fillStyle = 'rgba(216, 228, 232, 0.08)'
          ctx.beginPath()
          ctx.arc(x + CELL / 2, y + CELL / 2, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    drawWallEdges(timestamp, 1)

    // exit rune
    const exitX = level.exit.col * CELL + CELL / 2
    const exitY = level.exit.row * CELL + CELL / 2
    const exitPulse = 10 + Math.sin(timestamp / 260) * 4
    ctx.save()
    ctx.shadowColor = '#2df5c9'
    ctx.shadowBlur = exitPulse
    ctx.fillStyle = '#2df5c9'
    ctx.beginPath()
    ctx.arc(exitX, exitY, CELL / 2 - 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // flood
    const front = floodFrontRow(level, timestamp)
    floodPercent.value = Math.max(0, Math.min(100, Math.round(((front + 1) / level.maze.length) * 100)))

    const floodBoundaryY = (front + 1) * CELL
    if (floodBoundaryY > 0) {
      ctx.save()
      ctx.globalAlpha = 0.4
      const gradient = ctx.createLinearGradient(0, 0, 0, floodBoundaryY)
      gradient.addColorStop(0, '#7b2ff7')
      gradient.addColorStop(1, '#0dd3c4')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvasWidth.value, floodBoundaryY)
      ctx.restore()

      ctx.save()
      ctx.strokeStyle = '#7ffcec'
      ctx.lineWidth = 2
      ctx.shadowColor = '#2df5c9'
      ctx.shadowBlur = 10
      ctx.beginPath()
      for (let x = 0; x <= canvasWidth.value; x += 6) {
        const wave = Math.sin(x / 22 + timestamp / 260) * 3
        const yy = floodBoundaryY + wave
        if (x === 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.stroke()
      ctx.restore()

      // Boosted wall outlines punch back through the water tint.
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, canvasWidth.value, floodBoundaryY)
      ctx.clip()
      drawWallEdges(timestamp, 1.8)
      ctx.restore()
    }

    if (enemy.value) {
      drawSprite(enemyImg, enemy.value.row, enemy.value.col, enemy.value.facingLeft, '#ff5f3a', timestamp)
    }
    drawSprite(playerImg, player.value.row, player.value.col, player.value.facingLeft, '#2df5c9', timestamp)

    if (timestamp >= invulnerableUntil && player.value.row <= front) {
      triggerCaught('flood', timestamp)
    }
  }

  function tryMove(deltaRow, deltaCol) {
    const level = currentLevel.value
    if (!level) return
    const newRow = player.value.row + deltaRow
    const newCol = player.value.col + deltaCol

    if (level.maze[newRow] && level.maze[newRow][newCol] === 0) {
      if (deltaCol !== 0) player.value.facingLeft = deltaCol < 0
      player.value.row = newRow
      player.value.col = newCol

      if (enemy.value && enemy.value.row === newRow && enemy.value.col === newCol) {
        triggerCaught('guardian', performance.now())
        return
      }

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

  // ---------- Joystick ----------
  const joystickBase = ref(null)
  const knobPosition = ref({ x: 0, y: 0 })
  let joystickCenter = { x: 0, y: 0 }
  let currentDirection = { row: 0, col: 0 }
  let joystickMoveIntervalId = null
  const JOYSTICK_RADIUS = 50
  const DEAD_ZONE = 15

  function handleJoystickStart(event) {
    const rect = joystickBase.value.getBoundingClientRect()
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    updateJoystick(event)

    if (joystickMoveIntervalId) clearInterval(joystickMoveIntervalId)
    joystickMoveIntervalId = setInterval(() => {
      if (currentDirection.row !== 0 || currentDirection.col !== 0) {
        tryMove(currentDirection.row, currentDirection.col)
      }
    }, 200)
  }

  function handleJoystickMove(event) {
    updateJoystick(event)
  }

  function updateJoystick(event) {
    const touch = event.touches ? event.touches[0] : event
    const deltaX = touch.clientX - joystickCenter.x
    const deltaY = touch.clientY - joystickCenter.y

    const distance = Math.min(Math.hypot(deltaX, deltaY), JOYSTICK_RADIUS)
    const angle = Math.atan2(deltaY, deltaX)

    knobPosition.value = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }

    if (distance < DEAD_ZONE) {
      currentDirection = { row: 0, col: 0 }
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      currentDirection = deltaX > 0 ? { row: 0, col: 1 } : { row: 0, col: -1 }
    } else {
      currentDirection = deltaY > 0 ? { row: 1, col: 0 } : { row: -1, col: 0 }
    }
  }

  function handleJoystickEnd() {
    if (joystickMoveIntervalId) {
      clearInterval(joystickMoveIntervalId)
      joystickMoveIntervalId = null
    }
    currentDirection = { row: 0, col: 0 }
    knobPosition.value = { x: 0, y: 0 }
  }

  // ---------- Game loop ----------
  let running = false
  let animFrameId = null

  function loop(timestamp) {
    if (!running) return
    drawMaze(timestamp)
    animFrameId = requestAnimationFrame(loop)
  }

  function startGame() {
    ctx = canvasEl.value.getContext('2d')
    loadImages(() => {
      loadLevel(currentLevelIndex.value)
      window.addEventListener('keydown', handleKeydown)
      running = true
      animFrameId = requestAnimationFrame(loop)
    })
  }

  function stopGame() {
    running = false
    if (animFrameId) cancelAnimationFrame(animFrameId)
    if (enemyIntervalId) clearInterval(enemyIntervalId)
    if (joystickMoveIntervalId) clearInterval(joystickMoveIntervalId)
    window.removeEventListener('keydown', handleKeydown)
  }

  return {
    canvasEl,
    currentLevelIndex,
    floodPercent,
    caughtMessage,
    joystickBase,
    knobPosition,
    tryMove,
    startGame,
    stopGame,
    handleJoystickStart,
    handleJoystickMove,
    handleJoystickEnd,
  }
}
