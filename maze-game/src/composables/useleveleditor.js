import { ref, computed } from 'vue'
import { generateMaze, mulberry32, findPath } from '@/utils/mazeGenerator.js'
import { encodeLevel, decodeLevel } from '@/utils/mazeCodec.js'

export function useLevelEditor() {
  const roomsWide = ref(6)
  const roomsHigh = ref(6)
  const grid = ref(makeBlankGrid(roomsWide.value, roomsHigh.value))
  const start = ref({ row: 1, col: 1 })
  const exit = ref({ row: grid.value.length - 2, col: grid.value[0].length - 2 })
  const tool = ref('wall') // 'wall' | 'floor' | 'start' | 'exit'
  const validation = ref(null) // { valid: bool, pathLength: number } | null
  const shareCode = ref('')
  const importError = ref('')

  const width = computed(() => grid.value[0]?.length ?? 0)
  const height = computed(() => grid.value.length)

  function makeBlankGrid(rw, rh) {
    const w = rw * 2 + 1
    const h = rh * 2 + 1
    return Array.from({ length: h }, () => new Array(w).fill(1))
  }

  function resetBlank() {
    grid.value = makeBlankGrid(roomsWide.value, roomsHigh.value)
    start.value = { row: 1, col: 1 }
    exit.value = { row: grid.value.length - 2, col: grid.value[0].length - 2 }
    grid.value[start.value.row][start.value.col] = 0
    grid.value[exit.value.row][exit.value.col] = 0
    validation.value = null
    shareCode.value = ''
  }

  function randomizeFromGenerator() {
    const rng = mulberry32(Math.floor(Math.random() * 1e9))
    const level = generateMaze(roomsWide.value, roomsHigh.value, rng)
    grid.value = level.maze.map((row) => [...row])
    start.value = { ...level.start }
    exit.value = { ...level.exit }
    validation.value = null
    shareCode.value = ''
  }

  function paintCell(row, col) {
    if (row < 0 || row >= height.value || col < 0 || col >= width.value) return

    if (tool.value === 'start') {
      grid.value[row][col] = 0
      start.value = { row, col }
    } else if (tool.value === 'exit') {
      grid.value[row][col] = 0
      exit.value = { row, col }
    } else {
      const isStartOrExit =
        (row === start.value.row && col === start.value.col) ||
        (row === exit.value.row && col === exit.value.col)
      if (isStartOrExit) return // don't let paint tools wall over start/exit
      grid.value[row][col] = tool.value === 'wall' ? 1 : 0
    }
    validation.value = null
    shareCode.value = ''
  }

  function validate() {
    const path = findPath(grid.value, start.value, exit.value)
    const reachable = path.length > 1 || (start.value.row === exit.value.row && start.value.col === exit.value.col)
    validation.value = { valid: reachable, pathLength: path.length }
    return validation.value
  }

  function exportCode() {
    const result = validate()
    if (!result.valid) {
      shareCode.value = ''
      return null
    }
    const code = encodeLevel({ maze: grid.value, start: start.value, exit: exit.value })
    shareCode.value = code
    return code
  }

  function importCode(code) {
    importError.value = ''
    try {
      const level = decodeLevel(code.trim())
      grid.value = level.maze
      start.value = level.start
      exit.value = level.exit
      roomsWide.value = Math.floor((level.maze[0].length - 1) / 2)
      roomsHigh.value = Math.floor((level.maze.length - 1) / 2)
      validation.value = null
      shareCode.value = ''
      return true
    } catch (err) {
      importError.value = 'That code doesn\'t look like a valid level.'
      return false
    }
  }

  function getLevel() {
    return {
      maze: grid.value.map((row) => [...row]),
      start: { ...start.value },
      exit: { ...exit.value },
    }
  }

  return {
    roomsWide,
    roomsHigh,
    grid,
    start,
    exit,
    tool,
    width,
    height,
    validation,
    shareCode,
    importError,
    resetBlank,
    randomizeFromGenerator,
    paintCell,
    validate,
    exportCode,
    importCode,
    getLevel,
  }
}