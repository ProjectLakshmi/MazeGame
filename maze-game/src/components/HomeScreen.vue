<script setup>
import { ref, computed,  onMounted, onUnmounted } from 'vue'
import { useSaveData } from '@/composables/useSaveData'

const emit = defineEmits(['start','settings', 'continue','endless'])

const showHowToPlay = ref(false)
const difficulty = ref('normal')
const { getBestLevelReached, getLastLevel, getBestEndlessDepth } = useSaveData()
const bestLevel = ref(getBestLevelReached())
const lastLevel = computed(()=> getLastLevel())

const difficulties = [
  { id: 'easy', label: 'Easy', note: 'Smaller mazes, slower patrol' },
  { id: 'normal', label: 'Normal', note: 'Balanced' },
  { id: 'hard', label: 'Hard', note: 'Larger mazes, faster patrol' },
]

function handleStart() {
  emit('start', difficulty.value)
}
function handleContinue(){
  emit('continue', lastLevel.value)
}

// ---------- Signature element: a small maze that solves itself, on loop ----------
const previewCanvas = ref(null)
let animationFrameId = null

const previewMaze = [
  [1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1],
]
const previewPath = [
  {r:1,c:1},{r:1,c:2},{r:1,c:3},{r:2,c:3},{r:3,c:3},{r:3,c:4},{r:3,c:5},
  {r:3,c:6},{r:2,c:6},{r:1,c:6},{r:1,c:7},{r:2,c:7},{r:3,c:7},{r:4,c:7},
  {r:5,c:7},{r:5,c:6},{r:5,c:5},{r:5,c:4},{r:5,c:3},{r:5,c:2},{r:5,c:1},
  {r:6,c:1},{r:7,c:1},{r:7,c:2},{r:7,c:3},{r:7,c:4},{r:7,c:5},
]

function drawPreview(progress) {
  const canvas = previewCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const CELL = 16
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let r = 0; r < previewMaze.length; r++) {
    for (let c = 0; c < previewMaze[r].length; c++) {
      ctx.fillStyle = previewMaze[r][c] === 1 ? '#232b38' : '#161c26'
      ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1)
    }
  }

  const steps = Math.floor(progress * previewPath.length)
  for (let i = 0; i < steps && i < previewPath.length; i++) {
    const p = previewPath[i]
    const alpha = 0.25 + (i / previewPath.length) * 0.6
    ctx.fillStyle = `rgba(82, 227, 164, ${alpha})`
    ctx.fillRect(p.c * CELL + 2, p.r * CELL + 2, CELL - 5, CELL - 5)
  }

  const headIndex = Math.min(steps, previewPath.length - 1)
  const head = previewPath[headIndex]
  ctx.fillStyle = '#52e3a4'
  ctx.beginPath()
  ctx.arc(head.c * CELL + CELL / 2, head.r * CELL + CELL / 2, 5, 0, Math.PI * 2)
  ctx.fill()
}

function animatePreview(timestamp) {
  const cycleDuration = 3200
  const progress = (timestamp % cycleDuration) / cycleDuration
  drawPreview(progress)
  animationFrameId = requestAnimationFrame(animatePreview)
}

onMounted(() => {
  animationFrameId = requestAnimationFrame(animatePreview)
})
onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="home">
    <canvas ref="previewCanvas" class="preview" width="144" height="144"></canvas>

    <p class="eyebrow">Procedural maze escape</p>
    <h1>Maze Escape</h1>
    <p class="tagline">A new maze every level. A patrol that never stops looking.</p>

    <div class="difficulty-row">
      <button
        v-for="d in difficulties"
        :key="d.id"
        class="difficulty-btn"
        :class="{ active: difficulty === d.id }"
        @click="difficulty = d.id"
        :title="d.note"
      >
        {{ d.label }}
      </button>
    </div>
    <button v-if="lastLevel !== null" class="continue-btn" @click="handleContinue"> <!-- ADDED -->
  Continue — Level {{ lastLevel + 1 }}
</button>
    <button class="start-btn" @click="handleStart">Start Game</button>
    <button class="settings-btn" @click="$emit('settings')">⚙ Settings</button>
    <button class="howto-toggle" @click="showHowToPlay = !showHowToPlay">
      {{ showHowToPlay ? 'Hide instructions' : 'How to play' }}
    </button>

    <div v-if="showHowToPlay" class="howto-panel">
      <div class="howto-row"><span class="key">Drag joystick</span> Move through the maze</div>
      <div class="howto-row"><span class="key">Green tile</span> Reach it to clear the level</div>
      <div class="howto-row"><span class="key">Red patrol</span> Touching it resets your progress on that level</div>
    </div>

    <div class="stats-bar">
      <span class="stat-label">Best level reached</span>
      <span class="stat-value">{{ String(bestLevel).padStart(2, '0') }}</span>
    </div>
    <div class="stats-bar">                                                       <!-- ADD -->
  <span class="stat-label">Best endless depth</span>
  <span class="stat-value">{{ String(bestEndlessDepth).padStart(2, '0') }}</span>
</div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap');

.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 10px;
  text-align: center;
  padding: 32px 20px;
  background: #10141b;
  color: #e7ebf0;
  font-family: 'Space Grotesk', sans-serif;
}

.preview {
  border-radius: 6px;
  margin-bottom: 8px;
}

.eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #52e3a4;
  margin: 0;
}

h1 {
  font-size: 40px;
  font-weight: 700;
  margin: 4px 0 0;
  letter-spacing: -0.01em;
}

.tagline {
  color: #8a97a8;
  font-size: 15px;
  margin: 0 0 12px;
  max-width: 320px;
}

.difficulty-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.difficulty-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #2a3340;
  background: transparent;
  color: #8a97a8;
  cursor: pointer;
}

.difficulty-btn.active {
  border-color: #52e3a4;
  color: #52e3a4;
  background: rgba(82, 227, 164, 0.08);
}

.start-btn {
  padding: 14px 40px;
  font-size: 17px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  border-radius: 8px;
  border: none;
  background: #52e3a4;
  color: #0d1710;
  cursor: pointer;
  margin-top: 4px;
}

.start-btn:active {
  transform: scale(0.98);
}

.settings-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid #2a3340;
  background: transparent;
  color: #8a97a8;
  cursor: pointer;
  margin-top: 6px;
}

.settings-btn:hover {
  border-color: #52e3a4;
  color: #52e3a4;
}

.howto-toggle {
  background: none;
  border: none;
  color: #8a97a8;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 10px;
  font-family: 'JetBrains Mono', monospace;
}

.howto-panel {
  margin-top: 8px;
  border: 1px solid #2a3340;
  border-radius: 8px;
  padding: 14px 18px;
  max-width: 340px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.howto-row {
  font-size: 13px;
  color: #b8c0cc;
}

.key {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #52e3a4;
  border: 1px solid #2a3340;
  border-radius: 4px;
  padding: 1px 6px;
  margin-right: 8px;
}

.stats-bar {
  margin-top: 20px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.stat-label {
  font-size: 11px;
  color: #5f6b7a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-value {
  font-size: 16px;
  color: #52e3a4;
  font-weight: 500;
}
.continue-btn {
  padding: 12px 40px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
  border-radius: 8px;
  border: 1px solid #52e3a4;
  background: transparent;
  color: #52e3a4;
  cursor: pointer;
  margin-top: 4px;
}
.continue-btn:active {
  transform: scale(0.98);
  background: rgba(82, 227, 164, 0.08);
}
</style>