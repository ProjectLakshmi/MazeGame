export function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateMaze(roomsWide, roomsHigh, rng = Math.random, braidChance = 0.15) { // CHANGED — added braidChance param
  const width = roomsWide * 2 + 1
  const height = roomsHigh * 2 + 1

  const maze = []
  for (let r = 0; r < height; r++) maze.push(new Array(width).fill(1))

  const visited = []
  for (let r = 0; r < roomsHigh; r++) visited.push(new Array(roomsWide).fill(false))

  function carve(roomRow, roomCol) {
    visited[roomRow][roomCol] = true
    maze[roomRow * 2 + 1][roomCol * 2 + 1] = 0

    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    shuffle(directions, rng) // CHANGED — was directions.sort(() => rng() == 0.5), which barely shuffled at all

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
  braidMaze(maze, rng, braidChance) // ADDED

  return {
    maze,
    start: { row: 1, col: 1 },
    exit: { row: height - 2, col: width - 2 },
  }
}

// ADDED — proper Fisher-Yates shuffle using the seeded rng
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// ADDED — turns some dead ends into loops so alternate routes exist
function braidMaze(maze, rng, braidChance) {
  const rows = maze.length
  const cols = maze[0].length
  const directions = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ]

  for (let r = 1; r < rows; r += 2) {
    for (let c = 1; c < cols; c += 2) {
      if (maze[r][c] !== 0) continue

      // count open neighbors two cells away (i.e. connected rooms)
      const openDirs = []
      const closedDirs = []
      for (const [dr, dc] of directions) {
        const nr = r + dr
        const nc = c + dc
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        const wallR = r + dr / 2
        const wallC = c + dc / 2
        if (maze[wallR][wallC] === 0) openDirs.push([dr, dc])
        else if (maze[nr][nc] === 0) closedDirs.push([dr, dc]) // wall present but room exists on other side
      }

      // dead end = exactly one connection
      if (openDirs.length === 1 && closedDirs.length > 0 && rng() < braidChance) {
        const [dr, dc] = closedDirs[Math.floor(rng() * closedDirs.length)]
        maze[r + dr / 2][c + dc / 2] = 0 // knock down the wall, creating a loop
      }
    }
  }
}

export function findPath(maze, from, to){
  const rows = maze.length
  const cols = maze[0].length
  const visited = Array.from({length: rows}, ()=> new Array(cols).fill(false))
  const cameFrom = {}
  const queue = [from]
  visited[from.row][from.col]=true;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  const key = (r, c) => r + ',' + c

  while(queue.length>0){
    const current = queue.shift()
    if(current.row === to.row && current.col === to.col) break

    for(let r=0;r<4;r++){
        const neighborrow  = current.row + directions[r][0]
        const neighborcol = current.col + directions[r][1]
        const inBounds = neighborrow >=0 && neighborrow < rows && neighborcol >=0 && neighborcol < cols
        if(inBounds && maze[neighborrow][neighborcol] === 0 && !visited[neighborrow][neighborcol]){
            visited[neighborrow][neighborcol] = true
            cameFrom[key(neighborrow, neighborcol)] = current
            queue.push({row: neighborrow, col: neighborcol})
        }
    }
  }
  const path = []
  let step = to
  while(step){
      path.unshift(step)
      step = cameFrom[key(step.row, step.col)]
  }
  return path
}

export function collectFloorCells(maze) {
  const cells = []
  for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
      if (maze[r][c] === 0) cells.push({ row: r, col: c })
    }
  }
  return cells
}

export function pickEnemyPatrol(level) {
  const floorCells = collectFloorCells(level.maze)
  let path = []
  let attempts = 0
  while (path.length < 4 && attempts < 20) {
    const a = floorCells[Math.floor(Math.random() * floorCells.length)]
    const b = floorCells[Math.floor(Math.random() * floorCells.length)]
    const distFromStart = Math.abs(a.row - level.start.row) + Math.abs(a.col - level.start.col)
    if (distFromStart < 3) { attempts++; continue }
    path = findPath(level.maze, a, b)
    attempts++
  }
  if (path.length < 2) path = findPath(level.maze, level.start, level.exit)
  return { path, pathIndex: 0, direction: 1 }
}