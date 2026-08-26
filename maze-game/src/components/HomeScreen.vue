<script setup>
import { ref, computed,  onMounted, onUnmounted } from 'vue'
import { useSaveData } from '@/composables/useSaveData'

const emit = defineEmits(['start','settings', 'continue','endless', 'race'])

const showHowToPlay = ref(false)
const difficulty = ref('normal')
const { getBestLevelReached, getLastLevel, getEndlessBest } = useSaveData()
const bestLevel = ref(getBestLevelReached())
const lastLevel = computed(()=> getLastLevel())
const bestEndlessDepth = ref(getEndlessBest())

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
function handleEndless() {
  emit('endless')
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
    <!-- Background decoration -->
    <div class="bg-glow glow-one"></div>
    <div class="bg-glow glow-two"></div>

    <main class="game-card">

      <!-- Game Logo / Preview -->
      <div class="logo-section">
        <div class="maze-frame">
          <canvas
            ref="previewCanvas"
            class="preview"
            width="144"
            height="144"
          ></canvas>

          <div class="scan-line"></div>
        </div>

        <div class="eyebrow">
          <span class="status-dot"></span>
          PROCEDURAL MAZE ESCAPE
        </div>
      </div>

      <!-- Title -->
      <section class="hero">
        <h1>Maze <span>Escape</span></h1>

        <p class="tagline">
          A new maze every level.
          <br />
          A patrol that never stops looking.
        </p>
      </section>

      <!-- Difficulty -->
      <section class="difficulty-section">
        <div class="section-label">
          <span>DIFFICULTY</span>
          <span class="selected-label">
            {{ difficulty.toUpperCase() }}
          </span>
        </div>

        <div class="difficulty-row">
          <button
            v-for="d in difficulties"
            :key="d.id"
            class="difficulty-btn"
            :class="{ active: difficulty === d.id }"
            @click="difficulty = d.id"
          >
            <span class="difficulty-name">{{ d.label }}</span>
            <span class="difficulty-note">{{ d.note }}</span>
          </button>
        </div>
      </section>

      <!-- Main Actions -->
      <section class="actions">

        <!-- Continue -->
        <button
          v-if="lastLevel !== null"
          class="continue-btn"
          @click="handleContinue"
        >
          <span class="action-icon">↻</span>

          <span class="action-content">
            <strong>Continue</strong>
            <small>Level {{ lastLevel + 1 }}</small>
          </span>

          <span class="action-arrow">→</span>
        </button>

        <!-- Start -->
        <button class="start-btn" @click="handleStart">
          <span class="play-icon">▶</span>
          <span>START GAME</span>
        </button>

        <!-- Secondary modes -->
        <div class="secondary-actions">

          <button class="secondary-btn" @click="handleEndless">
            <span class="secondary-icon">∞</span>
            <span>
              <strong>Endless</strong>
              <small>Infinite maze</small>
            </span>
          </button>

          <button class="secondary-btn" @click="$emit('race')">
            <span class="secondary-icon">⚡</span>
            <span>
              <strong>Race</strong>
              <small>Beat the clock</small>
            </span>
          </button>

          <button class="secondary-btn" @click="$emit('settings')">
            <span class="secondary-icon">⚙</span>
            <span>
              <strong>Settings</strong>
              <small>Game options</small>
            </span>
          </button>

        </div>
      </section>

      <!-- How To Play -->
      <section class="howto-section">
        <button
          class="howto-toggle"
          @click="showHowToPlay = !showHowToPlay"
        >
          <span class="help-icon">?</span>

          <span>
            {{ showHowToPlay ? 'Hide instructions' : 'How to play' }}
          </span>

          <span class="chevron" :class="{ open: showHowToPlay }">
            ↓
          </span>
        </button>

        <transition name="slide">
          <div v-if="showHowToPlay" class="howto-panel">

            <div class="howto-row">
              <span class="instruction-icon">🕹</span>
              <div>
                <strong>Move</strong>
                <p>Drag the joystick to navigate the maze.</p>
              </div>
            </div>

            <div class="howto-row">
              <span class="instruction-icon green">●</span>
              <div>
                <strong>Reach the goal</strong>
                <p>Find the green tile to clear the level.</p>
              </div>
            </div>

            <div class="howto-row">
              <span class="instruction-icon red">●</span>
              <div>
                <strong>Avoid the patrol</strong>
                <p>Touching the patrol resets the level.</p>
              </div>
            </div>

          </div>
        </transition>
      </section>

      <!-- Stats -->
      <section class="stats">

        <div class="stat-card">
          <div class="stat-icon">◆</div>

          <div class="stat-info">
            <span>BEST LEVEL</span>
            <strong>
              {{ String(bestLevel).padStart(2, '0') }}
            </strong>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">∞</div>

          <div class="stat-info">
            <span>ENDLESS DEPTH</span>
            <strong>
              {{ String(bestEndlessDepth).padStart(2, '0') }}
            </strong>
          </div>
        </div>

      </section>

      <footer>
        <span>MAZE ESCAPE</span>
        <span>•</span>
        <span>PROCEDURAL ADVENTURE</span>
      </footer>

    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* =========================
   GLOBAL
========================= */

* {
  box-sizing: border-box;
  margin:0px
}

.home {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 40px 20px;

  background:
    radial-gradient(
      circle at 50% 15%,
      rgba(82, 227, 164, 0.08),
      transparent 30%
    ),
    #090d13;

  color: #edf2f7;

  font-family: 'Space Grotesk', sans-serif;
}

/* Subtle background grid */

.home::before {
  content: '';
  position: absolute;
  inset: 0;

  background-image:
    linear-gradient(
      rgba(255,255,255,0.018) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255,255,255,0.018) 1px,
      transparent 1px
    );

  background-size: 40px 40px;

  mask-image: linear-gradient(
    to bottom,
    black,
    transparent 90%
  );

  pointer-events: none;
}

/* Background glow */

.bg-glow {
  position: absolute;
  width: 350px;
  height: 350px;
  border-radius: 50%;

  filter: blur(100px);

  opacity: 0.12;
  pointer-events: none;
}

.glow-one {
  background: #52e3a4;
  top: -150px;
  left: -100px;
}

.glow-two {
  background: #3b82f6;
  bottom: -180px;
  right: -120px;
}

/* =========================
   MAIN CARD
========================= */

.game-card {
  position: relative;
  z-index: 2;

  width: min(480px, 100%);

  padding: 38px 34px 28px;

  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 24px;

  background:
    linear-gradient(
      145deg,
      rgba(23, 30, 40, 0.96),
      rgba(12, 17, 24, 0.97)
    );

  box-shadow:
    0 30px 80px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.04);

  backdrop-filter: blur(20px);

  text-align: center;
}

/* =========================
   MAZE PREVIEW
========================= */

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.maze-frame {
  position: relative;

  width: 168px;
  height: 168px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      #1a2431,
      #101721
    );

  border: 1px solid #293545;

  box-shadow:
    0 0 0 6px rgba(82,227,164,0.025),
    0 15px 40px rgba(0,0,0,0.35);

  overflow: hidden;
}

.preview {
  width: 144px;
  height: 144px;

  border-radius: 8px;
}

.scan-line {
  position: absolute;

  left: 12px;
  right: 12px;

  height: 1px;

  background: rgba(82,227,164,0.35);

  box-shadow: 0 0 8px rgba(82,227,164,0.5);

  animation: scan 3s linear infinite;

  pointer-events: none;
}

@keyframes scan {
  0% {
    top: 10px;
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    top: 158px;
    opacity: 0;
  }
}

/* =========================
   EYEBROW
========================= */

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-top: 20px;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;
  font-weight: 500;

  letter-spacing: 0.18em;

  color: #52e3a4;
}

.status-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #52e3a4;

  box-shadow:
    0 0 8px #52e3a4;

  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }
}

/* =========================
   HERO
========================= */

.hero {
  margin-top: 14px;
}

h1 {
  margin: 0;

  font-size: clamp(38px, 9vw, 52px);

  line-height: 1;

  letter-spacing: -0.045em;

  font-weight: 700;
}

h1 span {
  color: #52e3a4;

  text-shadow:
    0 0 30px rgba(82,227,164,0.15);
}

.tagline {
  margin: 16px auto 0;

  max-width: 350px;

  color: #7f8da0;

  font-size: 14px;

  line-height: 1.6;
}

/* =========================
   DIFFICULTY
========================= */

.difficulty-section {
  margin-top: 28px;
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 10px;

  font-family: 'JetBrains Mono', monospace;

  font-size: 9px;
  letter-spacing: 0.14em;

  color: #5f6c7c;
}

.selected-label {
  color: #52e3a4;
}

.difficulty-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.difficulty-btn {
  position: relative;

  min-height: 58px;

  padding: 9px 8px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  border-radius: 10px;

  border: 1px solid #273240;

  background: rgba(255,255,255,0.015);

  color: #7f8da0;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.difficulty-btn:hover {
  border-color: #3c4a5b;
  transform: translateY(-2px);
}

.difficulty-btn.active {
  border-color: #52e3a4;

  background:
    linear-gradient(
      145deg,
      rgba(82,227,164,0.13),
      rgba(82,227,164,0.035)
    );

  color: #52e3a4;

  box-shadow:
    0 0 20px rgba(82,227,164,0.05);
}

.difficulty-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
}

.difficulty-note {
  margin-top: 3px;

  font-size: 9px;

  color: #536173;
}

.difficulty-btn.active .difficulty-note {
  color: #6f8e80;
}

/* =========================
   ACTIONS
========================= */

.actions {
  margin-top: 18px;
}

.start-btn,
.continue-btn,
.secondary-btn {
  font-family: 'Space Grotesk', sans-serif;
  cursor: pointer;
}

.start-btn {
  width: 100%;

  height: 58px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  border: none;
  border-radius: 12px;

  background: linear-gradient(
    135deg,
    #52e3a4,
    #43d99a
  );

  color: #07130e;

  font-size: 15px;
  font-weight: 700;

  letter-spacing: 0.04em;

  box-shadow:
    0 8px 25px rgba(82,227,164,0.18);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.start-btn:hover {
  transform: translateY(-2px);

  box-shadow:
    0 12px 35px rgba(82,227,164,0.28);

  filter: brightness(1.05);
}

.start-btn:active {
  transform: translateY(1px);
}

.play-icon {
  font-size: 12px;
}

/* Continue */

.continue-btn {
  width: 100%;

  min-height: 58px;

  margin-bottom: 9px;

  display: flex;
  align-items: center;

  padding: 10px 14px;

  border-radius: 12px;

  border: 1px solid rgba(82,227,164,0.25);

  background: rgba(82,227,164,0.045);

  color: #52e3a4;

  text-align: left;

  transition: 0.2s ease;
}

.continue-btn:hover {
  background: rgba(82,227,164,0.08);

  border-color: rgba(82,227,164,0.5);

  transform: translateY(-1px);
}

.action-icon {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: rgba(82,227,164,0.1);

  font-size: 18px;
}

.action-content {
  margin-left: 10px;

  display: flex;
  flex-direction: column;
}

.action-content strong {
  font-size: 13px;
}

.action-content small {
  margin-top: 2px;

  color: #6f7e8f;

  font-size: 10px;
}

.action-arrow {
  margin-left: auto;
  font-size: 18px;
}

/* =========================
   SECONDARY ACTIONS
========================= */

.secondary-actions {
  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 8px;

  margin-top: 9px;
}

.secondary-btn {
  min-height: 72px;

  padding: 10px 7px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 6px;

  border-radius: 11px;

  border: 1px solid #26313e;

  background: rgba(255,255,255,0.015);

  color: #c1cbd6;

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.secondary-btn:hover {
  transform: translateY(-2px);

  border-color: #3a4757;

  background: rgba(255,255,255,0.035);
}

.secondary-icon {
  font-size: 18px;
  color: #7f8da0;
}

.secondary-btn strong {
  display: block;

  font-size: 11px;
  font-weight: 600;
}

.secondary-btn small {
  display: block;

  margin-top: 2px;

  font-size: 8px;

  color: #566476;
}

/* =========================
   HOW TO PLAY
========================= */

.howto-section {
  margin-top: 18px;
}

.howto-toggle {
  width: 100%;

  display: flex;
  align-items: center;

  padding: 10px 12px;

  border: 1px solid transparent;

  border-radius: 9px;

  background: transparent;

  color: #718094;

  font-family: 'JetBrains Mono', monospace;

  font-size: 10px;

  cursor: pointer;

  transition: 0.2s ease;
}

.howto-toggle:hover {
  border-color: #26313e;
  background: rgba(255,255,255,0.02);

  color: #a9b5c3;
}

.help-icon {
  width: 18px;
  height: 18px;

  margin-right: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #354152;
  border-radius: 50%;

  font-size: 10px;
}

.chevron {
  margin-left: auto;

  transition: transform 0.25s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.howto-panel {
  margin-top: 5px;

  padding: 13px;

  display: flex;
  flex-direction: column;

  gap: 10px;

  border: 1px solid #26313e;
  border-radius: 11px;

  background: rgba(255,255,255,0.018);

  text-align: left;
}

.howto-row {
  display: flex;
  align-items: center;

  gap: 11px;
}

.instruction-icon {
  width: 30px;
  height: 30px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 7px;

  background: #202a36;

  font-size: 13px;
}

.instruction-icon.green {
  color: #52e3a4;
}

.instruction-icon.red {
  color: #ff6675;
}

.howto-row strong {
  font-size: 11px;
  color: #cbd4de;
}

.howto-row p {
  margin: 2px 0 0;

  color: #637184;

  font-size: 9px;
}

/* Animation */

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* =========================
   STATS
========================= */

.stats {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 8px;

  margin-top: 18px;
}

.stat-card {
  min-height: 70px;

  display: flex;
  align-items: center;

  padding: 12px;

  border: 1px solid #222d39;
  border-radius: 11px;

  background: rgba(255,255,255,0.012);

  text-align: left;
}

.stat-icon {
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  background: rgba(82,227,164,0.07);

  color: #52e3a4;

  font-size: 13px;
}

.stat-info {
  margin-left: 9px;

  display: flex;
  flex-direction: column;
}

.stat-info span {
  font-family: 'JetBrains Mono', monospace;

  font-size: 8px;

  letter-spacing: 0.08em;

  color: #526073;
}

.stat-info strong {
  margin-top: 3px;

  font-family: 'JetBrains Mono', monospace;

  font-size: 19px;

  color: #52e3a4;
}

/* =========================
   FOOTER
========================= */

footer {
  display: flex;
  justify-content: center;
  gap: 7px;

  margin-top: 22px;

  font-family: 'JetBrains Mono', monospace;

  font-size: 7px;

  letter-spacing: 0.12em;

  color: #354150;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 520px) {
  .home {
    padding: 20px 12px;
    align-items: flex-start;
  }

  .game-card {
    margin: auto 0;

    padding: 28px 18px 22px;

    border-radius: 20px;
  }

  .maze-frame {
    width: 150px;
    height: 150px;
  }

  .preview {
    width: 128px;
    height: 128px;
  }

  h1 {
    font-size: 40px;
  }

  .tagline {
    font-size: 13px;
  }

  .difficulty-btn {
    min-height: 54px;
  }

  .secondary-actions {
    gap: 6px;
  }

  .secondary-btn {
    min-height: 68px;
  }

  .secondary-btn small {
    display: none;
  }

  .stat-card {
    padding: 9px;
  }
}

@media (max-height: 720px) {
  .home {
    padding: 18px;
  }

  .game-card {
    padding-top: 24px;
    padding-bottom: 20px;
  }

  .maze-frame {
    width: 130px;
    height: 130px;
  }

  .preview {
    width: 112px;
    height: 112px;
  }

  .eyebrow {
    margin-top: 12px;
  }

  .hero {
    margin-top: 10px;
  }

  .difficulty-section {
    margin-top: 18px;
  }

  .stats {
    margin-top: 12px;
  }

  footer {
    margin-top: 12px;
  }
}
</style>