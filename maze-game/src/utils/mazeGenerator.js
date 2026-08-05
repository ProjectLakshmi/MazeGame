export function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function generateMaze(roomsWide, roomsHigh, rng = Math.random) {
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
    directions.sort(() => rng() == 0.5)

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
