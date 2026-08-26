import { ref, computed } from 'vue'
import playerSprite from '@/asset/playerSheet.png'
import { generateMaze, mulberry32 } from '@/utils/mazeGenerator.js'
import { drawTiles, drawWallEdges, drawExit, drawSprite, getSquashStretch, WALK_FRAMES } from '@/utils/mazeRenderer.js'
import { useSwipeMove } from '@/composables/useSwipeMove.js'

const CELL = 40
const SPRITE_SIZE = 32
const MOVE_ANIM_DURATION = 150
const GHOST_COLORS = ['#7b2ff7', '#ff5f3a', '#0dd3c4', '#f7b32f', '#f75590', '#5590f7']

export function useRaceGame(raceApi) {
  const canvasEl = ref(null)
  const level = ref(null)
  const player = ref({ row: 0, col: 0, facingLeft: false })
  const prevPlayerPos = ref({ row: 0, col: 0 })
  let moveAnimStartTime = 0

  const phase = ref('countdown') // 'countdown' | 'racing' | 'finished'
  const countdownText = ref('')
  const elapsedMs = ref(0)
  const myFinishTime = ref(null)

  let ctx = null
  let running = false
  let animFrameId = null
  let raceStartPerfTime = null // performance.now() equivalent for raceStartUtc

  const playerImg = new Image()

  const canvasWidth = computed(() => (level.value ? level.value.maze[0].length * CELL : 320))
  const canvasHeight = computed(() => (level.value ? level.value.maze.length * CELL : 320))

  function tryMove(deltaRow, deltaCol) {
    if (phase.value !== 'racing' || !level.value) return
    const newRow = player.value.row + deltaRow
    const newCol = player.value.col + deltaCol

    if (level.value.maze[newRow] && level.value.maze[newRow][newCol] === 0) {
      if (deltaCol !== 0) player.value.facingLeft = deltaCol < 0
      prevPlayerPos.value = { row: player.value.row, col: player.value.col }
      player.value.row = newRow
      player.value.col = newCol
      moveAnimStartTime = performance.now()

      raceApi.reportProgress(newRow, newCol)

      if (newRow === level.value.exit.row && newCol === level.value.exit.col) {
        finishRace()
      }
    }
  }

  function finishRace() {
    phase.value = 'finished'
    myFinishTime.value = performance.now() - raceStartPerfTime
    raceApi.reportFinish(myFinishTime.value)
  }

  const { handleTouchStart, handleTouchMove, handleTouchEnd, stopSwipe } = useSwipeMove(tryMove, {
    stepThreshold: 24,
    holdRepeatMs: 110,
  })

  const KEY_MOVE_MAP = {
    ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
  }
  let activeKey = null
  let keyRepeatId = null
  function handleKeydown(event) {
    const move = KEY_MOVE_MAP[event.key]
    if (!move) return
    event.preventDefault()
    if (activeKey === event.key) return
    activeKey = event.key
    tryMove(move[0], move[1])
    if (keyRepeatId) clearInterval(keyRepeatId)
    keyRepeatId = setInterval(() => tryMove(move[0], move[1]), 110)
  }
  function handleKeyup(event) {
    if (event.key === activeKey) {
      activeKey = null
      if (keyRepeatId) { clearInterval(keyRepeatId); keyRepeatId = null }
    }
  }

  function getPlayerFrame(timestamp) {
    const since = timestamp - moveAnimStartTime
    if (since < 0 || since > 220) return 'idle'
    return WALK_FRAMES[Math.floor(timestamp / 90) % WALK_FRAMES.length]
  }

  function drawGhost(ctx, row, col, color, name) {
    const x = col * CELL + CELL / 2
    const y = row * CELL + CELL / 2
    ctx.save()
    ctx.globalAlpha = 0.55
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(x, y, CELL * 0.28, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.font = '10px monospace'
    ctx.fillStyle = '#e7ebf0'
    ctx.textAlign = 'center'
    ctx.fillText(name.slice(0, 8), x, y - CELL * 0.4)
    ctx.restore()
  }

  function draw(timestamp) {
    if (!ctx || !level.value) return
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    ctx.fillStyle = '#0c0f14'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

    const theme = { wallTop: '#2a3340', wallBottom: '#171d26', floorTop: '#1a212c', floorBottom: '#12161d', accent: '#52e3a4' }
    drawTiles(ctx, level.value, CELL, theme)
    drawWallEdges(ctx, level.value, CELL, timestamp, 1, theme)
    drawExit(ctx, level.value, CELL, timestamp, theme)

    // Opponent ghosts
    const opponents = raceApi.opponentPositions.value
    const players = raceApi.players.value
    let colorIndex = 0
    for (const p of players) {
      if (p.connectionId === raceApi.myConnectionId.value) continue
      const pos = opponents[p.connectionId]
      if (pos) drawGhost(ctx, pos.row, pos.col, GHOST_COLORS[colorIndex % GHOST_COLORS.length], p.name)
      colorIndex++
    }

    const squash = getSquashStretch(moveAnimStartTime, timestamp)
    const t = Math.min(1, Math.max(0, (timestamp - moveAnimStartTime) / MOVE_ANIM_DURATION))
    const interpRow = prevPlayerPos.value.row + (player.value.row - prevPlayerPos.value.row) * t
    const interpCol = prevPlayerPos.value.col + (player.value.col - prevPlayerPos.value.col) * t
    drawSprite(ctx, playerImg, interpRow, interpCol, player.value.facingLeft, theme.accent, timestamp, CELL, SPRITE_SIZE, squash, getPlayerFrame(timestamp))
  }

  function loop() {
    if (!running) return
    const now = performance.now()

    if (phase.value === 'countdown') {
      const msLeft = raceStartPerfTime - now
      if (msLeft <= 0) {
        phase.value = 'racing'
        countdownText.value = ''
      } else {
        countdownText.value = msLeft > 1000 ? String(Math.ceil(msLeft / 1000)) : 'GO!'
      }
    } else if (phase.value === 'racing') {
      elapsedMs.value = now - raceStartPerfTime
    }

    draw(now)
    animFrameId = requestAnimationFrame(loop)
  }

  function startRaceGame(raceInfo) {
    const rng = mulberry32(raceInfo.seed)
    level.value = generateMaze(raceInfo.roomsWide, raceInfo.roomsHigh, rng)
    player.value = { row: level.value.start.row, col: level.value.start.col, facingLeft: false }
    prevPlayerPos.value = { ...player.value }

    // Convert the server's shared UTC timestamp into a local performance.now()
    // reference so all clients' animation loops agree on "when GO happens"
    // regardless of clock differences, only relying on relative timing
    const msUntilStart = new Date(raceInfo.raceStartUtc).getTime() - Date.now()
    raceStartPerfTime = performance.now() + msUntilStart

    phase.value = 'countdown'

    playerImg.onload = () => {
      requestAnimationFrame(() => {
        canvasEl.value.width = canvasWidth.value
        canvasEl.value.height = canvasHeight.value
      })
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('keyup', handleKeyup)
      ctx = canvasEl.value.getContext('2d')
      running = true
      animFrameId = requestAnimationFrame(loop)
    }
    playerImg.src = playerSprite
  }

  function stopRaceGame() {
    running = false
    if (animFrameId) cancelAnimationFrame(animFrameId)
    stopSwipe()
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
  }

  return {
    canvasEl,
    phase,
    countdownText,
    elapsedMs,
    myFinishTime,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    startRaceGame,
    stopRaceGame,
  }
}