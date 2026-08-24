import { ref, computed } from 'vue'
import playerSprite from '@/asset/playerSheet.png'
import enemySprite from '@/asset/enemySheet.png'
import { useSaveData } from '@/composables/useSaveData.js'
import { useSound } from '@/composables/useSound.js'
import { useSwipeMove } from '@/composables/useSwipeMove.js'
import { mulberry32, generateMaze, findPath, pickEnemyPatrol } from '@/utils/mazeGenerator.js'
import { getThemeForLevel, getWorldIntroForLevel } from '@/utils/worldThemes.js'
import { drawTiles, drawWallEdges, drawExit, drawFlood, drawSprite, getSquashStretch, drawAmbientParticles, drawWallTexture, drawThemeBackground, WALK_FRAMES  } from '@/utils/mazeRenderer.js'

export function useMazeGame() {
  let ctx = null
  const canvasEl = ref(null)
  const TOTAL_LEVELS = 12
  const currentTheme = ref(getThemeForLevel(0))
  let moveAnimStartTime = 0
  const prevPlayerPos = ref({ row: 0, col: 0 })
  const prevEnemyPos = ref({ row: 0, col: 0 })
  const MOVE_ANIM_DURATION = 150
  const ENEMY_MOVE_ANIM_DURATION = 180
  let enemyMoveAnimStartTime = 0
  let shakeStartTime = -9999
  const CHASE_TRIGGER_DISTANCE = 4
  const CHASE_DURATION_MS = 3000
  const CHASE_REPATH_INTERVAL_MS = 600
  let chaseUntil = 0
  let lastChaseRepathAt = 0

  const isPaused = ref(false)
  let totalPausedMs = 0
  let pauseStartedAt = 0
  const worldIntro = ref(null)

  function now() {
    return performance.now() - totalPausedMs
  }

  function pauseGame() {
    if (isPaused.value || !running) return
    isPaused.value = true
    pauseStartedAt = performance.now()
    running = false
    if (animFrameId) cancelAnimationFrame(animFrameId)
    if (enemyIntervalId) clearInterval(enemyIntervalId)
  }

  function resumeGame() {
    if (!isPaused.value) return
    totalPausedMs += performance.now() - pauseStartedAt
    isPaused.value = false
    running = true
    startEnemyLoop()
    animFrameId = requestAnimationFrame(loop)
  }

  function togglePause() {
    if (isPaused.value) resumeGame()
    else pauseGame()
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      pauseGame() 
    }
   
  }

  const { getSettings, getProgress, saveLevelProgress, saveLastLevel, getEndlessBest, saveEndlessBest } = useSaveData()
  const {
    soundEnabled,
    toggleSound,
    playMoveSound,
    playCaughtSound,
    playLevelCompleteSound,
    playFloodWarningSound,
  } = useSound()

  const moveCount = ref(0)
  const levelstartTime = ref(0)
  const elapsedSeconds = ref(0)

  const gameMode = ref('story')      
  const endlessDepth = ref(0) 
  const endlessGameOver = ref(null) 

  const CELL = 40
  const SPRITE_SIZE = 32

  const currentLevelIndex = ref(0)
  const currentLevel = ref(null)
  const player = ref({ row: 0, col: 0, facingLeft: false })
  const enemy = ref(null)
  const floodPercent = ref(0)
  const caughtMessage = ref('')
  const levelCompleteInfo = ref(null)
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

  const FLOOD_START_DELAY_MS = 2500
  const BASE_RISE_MS_PER_ROW = 2600
  const MIN_RISE_MS_PER_ROW = 1000
  const MOVE_TIME_BUDGET_MS = 260
  const ENEMY_DODGE_BUFFER_MS = 4000
  let currentRiseMsPerRow = BASE_RISE_MS_PER_ROW
  let levelStartTime = 0
  let invulnerableUntil = 0
  let floodWarningPlayed = false

  function floodFrontRow(level, timestamp) {
    const elapsed = Math.max(0, timestamp - levelStartTime - FLOOD_START_DELAY_MS)
    return -1 + elapsed / currentRiseMsPerRow
  }

  function triggerCaught(reason, timestamp) {
    if (timestamp < invulnerableUntil) return
    if (gameMode.value === 'endless') {
    endRun(reason)
    return
  }
    invulnerableUntil = timestamp + 900
    playCaughtSound()
    vibrate(120)
    caughtMessage.value = reason === 'flood' ? 'Swallowed by the flood' : 'Spotted by the guardian'
    shakeStartTime = timestamp
    resetPositions(currentLevel.value)
    levelStartTime = timestamp
    setTimeout(() => {
      caughtMessage.value = ''
    }, 1100)
  }

  function endRun(reason) {
  running = false
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (enemyIntervalId) clearInterval(enemyIntervalId)
  playCaughtSound()
  vibrate([120, 60, 120])
  const best = saveEndlessBest(endlessDepth.value)
  endlessGameOver.value = {
    depth: endlessDepth.value + 1,
    best: best + 1,
    reason,
  }
}

  function loadLevel(index) {
    moveCount.value = 0
    levelstartTime.value = Date.now()
    saveLastLevel(index)
    const roomsWide = 4 + index
    const roomsHigh = 4 + index
    const rng = mulberry32(index + 1)
    const level = generateMaze(roomsWide, roomsHigh, rng)

    currentLevel.value = level
    currentTheme.value = getThemeForLevel(index)
    resetPositions(level)
    levelStartTime = now() 
    invulnerableUntil = 0
    floodPercent.value = 0
    floodWarningPlayed = false

    const shortestPath = findPath(level.maze, level.start, level.exit)
    const pathMoves = Math.max(1, shortestPath.length - 1)
    const dodgeBuffer = ENEMY_DODGE_BUFFER_MS * (1 + index * 0.1)
    const requiredSafeMs = pathMoves * MOVE_TIME_BUDGET_MS + dodgeBuffer
    const minSafeRiseMsPerRow = (requiredSafeMs - FLOOD_START_DELAY_MS) / level.exit.row

    const difficultyRiseMsPerRow = Math.max(MIN_RISE_MS_PER_ROW, BASE_RISE_MS_PER_ROW - index * 70)
    currentRiseMsPerRow = Math.max(difficultyRiseMsPerRow, minSafeRiseMsPerRow)

    requestAnimationFrame(() => {
      canvasEl.value.width = canvasWidth.value
      canvasEl.value.height = canvasHeight.value
    })

    startEnemyLoop()

    const intro = getWorldIntroForLevel(index)
    if(intro){
      worldIntro.value = intro
      pauseGame()
    }
  }

  function loadEndlessLevel(depth) {
  moveCount.value = 0
  levelstartTime.value = Date.now()

  const { rooms, braidChance, floodBonus } = getEndlessParams(depth)
  const rng = mulberry32(depth + 1)
  const level = generateMaze(rooms, rooms, rng, braidChance)

  currentLevel.value = level
  currentTheme.value = getThemeForLevel(depth)
  resetPositions(level)
  levelStartTime = now()
  invulnerableUntil = 0
  floodPercent.value = 0
  floodWarningPlayed = false

  const shortestPath = findPath(level.maze, level.start, level.exit)
  const pathMoves = Math.max(1, shortestPath.length - 1)
  const dodgeBuffer = ENEMY_DODGE_BUFFER_MS * (1 + depth * 0.04)
  const requiredSafeMs = pathMoves * MOVE_TIME_BUDGET_MS + dodgeBuffer
  const minSafeRiseMsPerRow = (requiredSafeMs - FLOOD_START_DELAY_MS) / level.exit.row

  const difficultyRiseMsPerRow = Math.max(MIN_RISE_MS_PER_ROW, BASE_RISE_MS_PER_ROW - depth * 25 - floodBonus)
  currentRiseMsPerRow = Math.max(difficultyRiseMsPerRow, minSafeRiseMsPerRow)

  requestAnimationFrame(() => {
    canvasEl.value.width = canvasWidth.value
    canvasEl.value.height = canvasHeight.value
  })

  startEnemyLoop()

  const intro = getWorldIntroForLevel(depth)
  if (intro) {
    worldIntro.value = intro
    pauseGame()
  }
}
const ENDLESS_BASE_ROOMS = 4
const ENDLESS_MAX_ROOMS = 15

function getEndlessParams(depth) {
  const rooms = Math.min(ENDLESS_BASE_ROOMS + depth, ENDLESS_MAX_ROOMS)
  const overflow = Math.max(0, ENDLESS_BASE_ROOMS + depth - ENDLESS_MAX_ROOMS)
  const braidChance = Math.max(0.05, 0.2 - overflow * 0.01) 
  const enemySpeedBonus = overflow * 15  
  const floodBonus = overflow * 40    
  return { rooms, braidChance, enemySpeedBonus, floodBonus }
}
  function dismissWorldIntro() {
  worldIntro.value = null
  if (isPaused.value) {
    resumeGame()
  } else if (!running) {
    running = true
    startEnemyLoop()
    animFrameId = requestAnimationFrame(loop)
  }
}
  function resetPositions(level) {
    player.value = { row: level.start.row, col: level.start.col, facingLeft: false }
    prevPlayerPos.value = { row: level.start.row, col: level.start.col }
    const patrol = pickEnemyPatrol(level)
    enemy.value = {
      row: patrol.path[0].row,
      col: patrol.path[0].col,
      path: patrol.path,
      pathIndex: 0,
      direction: 1,
      facingLeft: false,
      chasePath: null,
    }
    prevEnemyPos.value = { row: enemy.value.row, col: enemy.value.col }
    chaseUntil = 0
  }

  function startEnemyLoop() {
    if (enemyIntervalId) clearInterval(enemyIntervalId)
  let speed
  if (gameMode.value === 'endless') {
    const { enemySpeedBonus } = getEndlessParams(endlessDepth.value)
    speed = Math.max(220, 700 - endlessDepth.value * 25 - enemySpeedBonus)
  } else {
    speed = Math.max(320, 700 - currentLevelIndex.value * 40)
  }
  enemyIntervalId = setInterval(moveEnemy, speed)
  }

  function moveEnemy() {
  const e = enemy.value
  if (!e) return

  const timestamp = now()
  const distToPlayer = Math.abs(e.row - player.value.row) + Math.abs(e.col - player.value.col) 

  if (timestamp > chaseUntil && distToPlayer <= CHASE_TRIGGER_DISTANCE) {
    chaseUntil = timestamp + CHASE_DURATION_MS
  }
  const isChasing = timestamp < chaseUntil 

  prevEnemyPos.value = { row: e.row, col: e.col }
  enemyMoveAnimStartTime = timestamp

  if (isChasing) {

    if (!e.chasePath || e.chasePath.length < 2 || timestamp - lastChaseRepathAt > CHASE_REPATH_INTERVAL_MS) {
      e.chasePath = findPath(currentLevel.value.maze, { row: e.row, col: e.col }, { row: player.value.row, col: player.value.col })
      lastChaseRepathAt = timestamp
    }
    if (e.chasePath && e.chasePath.length > 1) {
      const next = e.chasePath[1]
      if (next.col !== e.col) e.facingLeft = next.col < e.col
      e.row = next.row
      e.col = next.col
      e.chasePath = e.chasePath.slice(1) 
    }
  } else {
    
    if (e.path.length <= 1) return
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
    e.chasePath = null 
  }

  if (e.row === player.value.row && e.col === player.value.col) {
    triggerCaught('guardian', timestamp) 
  }
}

  function easeOutQuad(t) {
    return t * (2 - t)
  }

  function getInterpolatedPos(prevPos, currentPos, animStartTime, duration, timestamp) {
    const elapsed = timestamp - animStartTime
    const t = Math.min(1, Math.max(0, elapsed / duration))
    const eased = easeOutQuad(t)
    return {
      row: prevPos.row + (currentPos.row - prevPos.row) * eased,
      col: prevPos.col + (currentPos.col - prevPos.col) * eased,
    }
  }

  function getShakeOffset(shakeStartTime, timestamp) {
    const elapsed = timestamp - shakeStartTime
    const duration = 300
    if (elapsed < 0 || elapsed > duration) return { x: 0, y: 0 }
    const decay = 1 - elapsed / duration
    const magnitude = 6 * decay
    return {
      x: (Math.random() - 0.5) * magnitude,
      y: (Math.random() - 0.5) * magnitude,
    }
  }

  function drawMaze(timestamp) {
    const level = currentLevel.value
    if (!level || !ctx) return
    const theme = currentTheme.value

    const shake = getShakeOffset(shakeStartTime, timestamp)
    ctx.save()
    ctx.translate(shake.x, shake.y)

   drawThemeBackground(ctx, canvasWidth.value, canvasHeight.value, theme, timestamp)
  drawTiles(ctx, level, CELL, theme)
  drawWallTexture(ctx, level, CELL, theme, timestamp)
  drawWallEdges(ctx, level, CELL, timestamp, 1, theme)
  drawExit(ctx, level, CELL, timestamp, theme)
  drawAmbientParticles(ctx, canvasWidth.value, canvasHeight.value, timestamp, theme)
    

    const front = floodFrontRow(level, timestamp)
    floodPercent.value = Math.max(0, Math.min(100, Math.round(((front + 1) / level.maze.length) * 100)))
    drawFlood(ctx, level, CELL, canvasWidth.value, timestamp, front, theme,
      (brightness) => drawWallEdges(ctx, level, CELL, timestamp, brightness, theme))

    if (floodPercent.value >= 70 && !floodWarningPlayed) {
      playFloodWarningSound()
      vibrate(80)
      floodWarningPlayed = true
    }

    const squash = getSquashStretch(moveAnimStartTime, timestamp)
    const interpPlayerPos = getInterpolatedPos(prevPlayerPos.value, player.value, moveAnimStartTime, MOVE_ANIM_DURATION, timestamp)

    if (enemy.value) {
      const interpEnemyPos = getInterpolatedPos(prevEnemyPos.value, enemy.value, enemyMoveAnimStartTime, ENEMY_MOVE_ANIM_DURATION, timestamp)
      drawSprite(ctx, enemyImg, interpEnemyPos.row, interpEnemyPos.col, enemy.value.facingLeft, '#ff5f3a', timestamp, CELL, SPRITE_SIZE, { scaleX: 1, scaleY: 1 }, getEnemyFrame(timestamp))
    }
    drawSprite(ctx, playerImg, interpPlayerPos.row, interpPlayerPos.col, player.value.facingLeft, theme.accent, timestamp, CELL, SPRITE_SIZE, squash, getPlayerFrame(timestamp))

    ctx.restore()

    const flashElapsed = timestamp - shakeStartTime
    if (flashElapsed >= 0 && flashElapsed < 200) {
      ctx.save()
      ctx.globalAlpha = 0.35 * (1 - flashElapsed / 200)
      ctx.fillStyle = '#ff3a3a'
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
      ctx.restore()
    }

    if (timestamp >= invulnerableUntil && player.value.row <= front) {
      triggerCaught('flood', timestamp)
    }
  }

  function tryMove(deltaRow, deltaCol) {
    const level = currentLevel.value
    if (!level || levelCompleteInfo.value || isPaused.value) return 
    const newRow = player.value.row + deltaRow
    const newCol = player.value.col + deltaCol

    if (level.maze[newRow] && level.maze[newRow][newCol] === 0) {
      if (deltaCol !== 0) player.value.facingLeft = deltaCol < 0
      prevPlayerPos.value = { row: player.value.row, col: player.value.col }
      player.value.row = newRow
      player.value.col = newCol
      moveCount.value++
      playMoveSound()
      moveAnimStartTime = now() 

      if (enemy.value && enemy.value.row === newRow && enemy.value.col === newCol) {
        triggerCaught('guardian', now()) 
        return
      }

      if (player.value.row === level.exit.row && player.value.col === level.exit.col) {
        if (gameMode.value === 'endless') {
    endlessDepth.value++
    playLevelCompleteSound()
    vibrate([40, 30, 40])
    loadEndlessLevel(endlessDepth.value)
  } else if (gameMode.value === 'custom') {
    const seconds = (Date.now() - levelstartTime.value) / 1000
    const stars = calculateStars(moveCount.value, seconds, level.maze.length)
    playLevelCompleteSound()
    vibrate([60, 40, 60])

    if (enemyIntervalId) clearInterval(enemyIntervalId)
    running = false
    if (animFrameId) cancelAnimationFrame(animFrameId)

    // Custom levels aren't part of story progress, so nothing gets saved —
    // this just shows the completion modal for feedback
    levelCompleteInfo.value = {
      levelIndex: null,
      custom: true,
      stars,
      moves: moveCount.value,
      seconds,
    }
  } else {
    const seconds = (Date.now() - levelstartTime.value) / 1000
    const stars = calculateStars(moveCount.value, seconds, level.maze.length)
    saveLevelProgress(currentLevelIndex.value, stars, moveCount.value, seconds)
    playLevelCompleteSound()
    vibrate([60, 40, 60])

        if (enemyIntervalId) clearInterval(enemyIntervalId)
        running = false
        if (animFrameId) cancelAnimationFrame(animFrameId)

        levelCompleteInfo.value = {
          levelIndex: currentLevelIndex.value,
          stars,
          moves: moveCount.value,
          seconds,
        }
      }
    }
  }
}

  function calculateStars(moves, seconds, mazeSize) {
    const perMoves = mazeSize * 2
    if (moves <= perMoves && seconds < 20) return 3
    if (moves <= perMoves * 1.5) return 2
    return 1
  }

  function isLevelUnlocked(index, results) {
    if (index === 0) return true
    const progress = results  ?? getProgress()
    return !!progress[index - 1]
  }

  function continueToNextLevel() {
    levelCompleteInfo.value = null
    if (currentLevelIndex.value + 1 < TOTAL_LEVELS) {
      currentLevelIndex.value++
      loadLevel(currentLevelIndex.value)
      running = true
      animFrameId = requestAnimationFrame(loop)
    }
  }

 const KEY_REPEAT_MS = 90
let keyRepeatIntervalId = null
let activeKeyMove = null

const KEY_MOVE_MAP = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

function handleKeydown(event) {
  if (event.key === 'Escape' || event.key === ' ') {
    togglePause()
    return
  }

  const move = KEY_MOVE_MAP[event.key]
  if (!move) return
  event.preventDefault()

  if (activeKeyMove === event.key) return

  activeKeyMove = event.key
  tryMove(move[0], move[1])

  if (keyRepeatIntervalId) clearInterval(keyRepeatIntervalId)
  keyRepeatIntervalId = setInterval(() => tryMove(move[0], move[1]), KEY_REPEAT_MS)
}

function handleKeyup(event) {
  if (event.key === activeKeyMove) {
    activeKeyMove = null
    if (keyRepeatIntervalId) {
      clearInterval(keyRepeatIntervalId)
      keyRepeatIntervalId = null
    }
  }
}

const WALK_FRAME_MS = 90
const PLAYER_IDLE_WINDOW_MS = 220 

function getPlayerFrame(timestamp) {
  const sinceMove = timestamp - moveAnimStartTime
  if (sinceMove < 0 || sinceMove > PLAYER_IDLE_WINDOW_MS) return 'idle'
  return WALK_FRAMES[Math.floor(timestamp / WALK_FRAME_MS) % WALK_FRAMES.length]
}

function getEnemyFrame(timestamp) {
  return WALK_FRAMES[Math.floor(timestamp / WALK_FRAME_MS) % WALK_FRAMES.length]
}

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    stopSwipe,
  } = useSwipeMove(tryMove, { stepThreshold: 24, holdRepeatMs: 90 })

  let running = false
  let animFrameId = null

  function loop(rawTimestamp) { 
    if (!running) return
    const timestamp = rawTimestamp - totalPausedMs 
    elapsedSeconds.value = (Date.now() - levelstartTime.value) / 1000
    drawMaze(timestamp) 
    animFrameId = requestAnimationFrame(loop)
  }

  function startGame(startIndex = 0) {
    gameMode.value = 'story' 
    currentLevelIndex.value = startIndex
    ctx = canvasEl.value.getContext('2d')
    loadImages(() => {
      loadLevel(currentLevelIndex.value)
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('keyup', handleKeyup)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      running = true
      animFrameId = requestAnimationFrame(loop)
    })
  }
  function startEndlessMode() {
  gameMode.value = 'endless'
  endlessDepth.value = 0
  endlessGameOver.value = null
  ctx = canvasEl.value.getContext('2d')
  loadImages(() => {
    loadEndlessLevel(endlessDepth.value)
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    running = true
    animFrameId = requestAnimationFrame(loop)
  })
}

function restartEndless() {
  endlessDepth.value = 0
  endlessGameOver.value = null
  loadEndlessLevel(0)
  running = true
  animFrameId = requestAnimationFrame(loop)
}

function loadCustomLevel(level) {
  moveCount.value = 0
  levelstartTime.value = Date.now()

  currentLevel.value = level
  currentTheme.value = getThemeForLevel(0)
  resetPositions(level)
  levelStartTime = now()
  invulnerableUntil = 0
  floodPercent.value = 0
  floodWarningPlayed = false

  // Use the same safety-margin logic as story levels so a custom maze
  // still gives the player a fair amount of time before the flood arrives
  const shortestPath = findPath(level.maze, level.start, level.exit)
  const pathMoves = Math.max(1, shortestPath.length - 1)
  const dodgeBuffer = ENEMY_DODGE_BUFFER_MS
  const requiredSafeMs = pathMoves * MOVE_TIME_BUDGET_MS + dodgeBuffer
  const minSafeRiseMsPerRow = (requiredSafeMs - FLOOD_START_DELAY_MS) / Math.max(1, level.exit.row)
  currentRiseMsPerRow = Math.max(BASE_RISE_MS_PER_ROW, minSafeRiseMsPerRow)

  requestAnimationFrame(() => {
    canvasEl.value.width = canvasWidth.value
    canvasEl.value.height = canvasHeight.value
  })

  startEnemyLoop()
}

function startCustomLevel(level) {
  gameMode.value = 'custom'
  endlessGameOver.value = null
  levelCompleteInfo.value = null
  ctx = canvasEl.value.getContext('2d')
  loadImages(() => {
    loadCustomLevel(level)
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    running = true
    animFrameId = requestAnimationFrame(loop)
  })
}

  function stopGame() {
    running = false
    if (animFrameId) cancelAnimationFrame(animFrameId)
    if (enemyIntervalId) clearInterval(enemyIntervalId)
    stopSwipe()
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
    document.removeEventListener('visibilitychange', handleVisibilityChange) 
  }

  function vibrate(pattern){
    if(typeof navigator !== 'undefined' && navigator.vibrate){
      navigator.vibrate(pattern)
    }
  }

  return {
    canvasEl,
    currentLevelIndex,
    floodPercent,
    caughtMessage,
    levelCompleteInfo,
    tryMove,
    startGame,
    stopGame,
    continueToNextLevel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getLevelResults: getProgress,
    isLevelUnlocked,
    TOTAL_LEVELS,
    soundEnabled,
    toggleSound,
    moveCount,
    elapsedSeconds,
    isPaused,       
    togglePause,
    worldIntro,
    dismissWorldIntro,
    gameMode,
    endlessDepth,
    endlessGameOver,
    startEndlessMode,
    restartEndless,
    startCustomLevel,
  }
}