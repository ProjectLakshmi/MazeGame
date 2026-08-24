<script setup>
import { ref, computed } from 'vue'
import { useLevelEditor } from '@/composables/useleveleditor'

const emit = defineEmits(['backToLevelSelect', 'playCustomLevel'])

const {
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
} = useLevelEditor()

resetBlank()

const isPainting = ref(false)
const importText = ref('')
const copied = ref(false)

const CELL_PX = computed(() => Math.min(28, Math.floor(340 / width.value)))

function cellClass(row, col) {
  const isWall = grid.value[row][col] === 1
  const isStart = start.value.row === row && start.value.col === col
  const isExit = exit.value.row === row && exit.value.col === col
  return {
    wall: isWall,
    floor: !isWall,
    'is-start': isStart,
    'is-exit': isExit,
  }
}

function onCellDown(row, col) {
  isPainting.value = true
  paintCell(row, col)
}
function onCellEnter(row, col) {
  if (isPainting.value) paintCell(row, col)
}
function stopPainting() {
  isPainting.value = false
}

function onGridTouchMove(event) {
  if (!isPainting.value) return
  const touch = event.touches[0]
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  if (el && el.dataset && el.dataset.row !== undefined) {
    paintCell(Number(el.dataset.row), Number(el.dataset.col))
  }
}

function handleRegenerate() {
  randomizeFromGenerator()
}

function handleValidate() {
  validate()
}

function handleExport() {
  copied.value = false
  exportCode()
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(shareCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    // clipboard unavailable — code is still visible to select manually
  }
}

function handleImport() {
  if (importCode(importText.value)) importText.value = ''
}

function playTest() {
  const result = validate()
  if (!result.valid) return
  emit('playCustomLevel', getLevel())
}
</script>

<template>
  <div class="editor-wrap" @mouseup="stopPainting" @mouseleave="stopPainting" @touchend="stopPainting">
    <div class="header-row">
      <button class="back-btn" @click="emit('backToLevelSelect')">← Levels</button>
      <h2 class="title">Build a Maze</h2>
      <div style="width: 64px"></div>
    </div>

    <div class="size-row">
      <label>
        Width
        <input type="range" min="3" max="14" v-model.number="roomsWide" @change="resetBlank" />
      </label>
      <label>
        Height
        <input type="range" min="3" max="14" v-model.number="roomsHigh" @change="resetBlank" />
      </label>
    </div>

    <p class="hint">Pick a tool, then tap or drag on the grid to paint it.</p>

    <div class="toolbar">
      <button :class="{ active: tool === 'wall' }" @click="tool = 'wall'">🧱 Wall</button>
      <button :class="{ active: tool === 'floor' }" @click="tool = 'floor'">⬜ Floor</button>
      <button :class="{ active: tool === 'start' }" @click="tool = 'start'">🚩 Start</button>
      <button :class="{ active: tool === 'exit' }" @click="tool = 'exit'">🎯 Exit</button>
      <button class="ghost" @click="resetBlank">Clear</button>
      <button class="ghost" @click="handleRegenerate">Random Base</button>
    </div>

    <div
      class="grid"
      :style="{ gridTemplateColumns: `repeat(${width}, ${CELL_PX}px)` }"
      @touchmove.prevent="onGridTouchMove"
    >
      <div
        v-for="(row, r) in grid"
        :key="r"
        class="grid-row"
      >
        <div
          v-for="(_, c) in row"
          :key="c"
          class="cell"
          :class="cellClass(r, c)"
          :style="{ width: CELL_PX + 'px', height: CELL_PX + 'px' }"
          :data-row="r"
          :data-col="c"
          @mousedown="onCellDown(r, c)"
          @mouseenter="onCellEnter(r, c)"
          @touchstart.prevent="onCellDown(r, c)"
        >
          <span v-if="start.row === r && start.col === c">S</span>
          <span v-else-if="exit.row === r && exit.col === c">E</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="secondary" @click="handleValidate">Check Path</button>
      <button class="primary" @click="playTest">▶ Play Test</button>
      <button class="secondary" @click="handleExport">Get Share Code</button>
    </div>

    <p v-if="validation" class="validation" :class="{ ok: validation.valid, bad: !validation.valid }">
      {{ validation.valid ? `Solvable — ${validation.pathLength - 1} steps to exit.` : 'No path from Start to Exit yet.' }}
    </p>

    <div v-if="shareCode" class="share-box">
      <p class="share-label">Share this code:</p>
      <div class="share-code-row">
        <code class="share-code">{{ shareCode }}</code>
        <button class="ghost small" @click="copyCode">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>
    </div>

    <div class="import-box">
      <p class="share-label">Load a code:</p>
      <div class="share-code-row">
        <input class="import-input" v-model="importText" placeholder="Paste a level code..." />
        <button class="ghost small" @click="handleImport">Load</button>
      </div>
      <p v-if="importError" class="validation bad">{{ importError }}</p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=JetBrains+Mono:wght@400&display=swap');

.editor-wrap {
  color: #e7ebf0;
  font-family: 'Space Grotesk', sans-serif;
  padding: 0 8px 24px;
  user-select: none;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.title { margin: 0; font-size: 18px; }
.back-btn { background: none; border: none; color: #8a97a8; cursor: pointer; }

.size-row {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #8a97a8;
  font-family: 'JetBrains Mono', monospace;
}
.size-row label { display: flex; flex-direction: column; gap: 4px; }

.hint {
  font-size: 12px;
  color: #8a97a8;
  margin: 0 0 10px;
  font-family: 'JetBrains Mono', monospace;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.toolbar button, .actions button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2a3340;
  background: #171d26;
  color: #e7ebf0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.toolbar button.active {
  border-color: #52e3a4;
  color: #52e3a4;
  box-shadow: 0 0 10px rgba(82, 227, 164, 0.25);
}
.toolbar button.ghost, .actions button.ghost, .share-box button.ghost, .import-box button.ghost {
  background: transparent;
}

.grid {
  display: inline-grid;
  gap: 1px;
  background: #0d1218;
  border: 2px solid #2a3340;
  border-radius: 8px;
  padding: 4px;
  margin: 0 auto 16px;
  touch-action: none;
}
.grid-row { display: contents; }
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  border-radius: 3px;
  cursor: pointer;
}
.cell.wall { background: #0a0d12; border: 1px solid #060809; }
.cell.floor { background: #4a5b6e; border: 1px solid #5d7288; }
.cell.floor:hover { background: #5d7288; }
.cell.wall:hover { background: #151b24; }
.cell.is-start { background: #2fa87c; color: #0d1710; }
.cell.is-exit { background: #52e3a4; color: #0d1710; box-shadow: 0 0 8px rgba(82, 227, 164, 0.6); }

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.actions .primary { background: #52e3a4; color: #0d1710; border-color: #52e3a4; }
.actions .secondary { background: transparent; }

.validation {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  margin: 4px 0 14px;
}
.validation.ok { color: #52e3a4; }
.validation.bad { color: #ff5f3a; }

.share-box, .import-box {
  background: #171d26;
  border: 1px solid #2a3340;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.share-label {
  font-size: 12px;
  color: #8a97a8;
  margin: 0 0 8px;
  font-family: 'JetBrains Mono', monospace;
}
.share-code-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.share-code {
  flex: 1;
  background: #0d1218;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  word-break: break-all;
  font-family: 'JetBrains Mono', monospace;
  color: #52e3a4;
}
.import-input {
  flex: 1;
  background: #0d1218;
  border: 1px solid #2a3340;
  border-radius: 6px;
  padding: 8px 10px;
  color: #e7ebf0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
button.small { padding: 8px 10px; font-size: 12px; white-space: nowrap; }
</style>