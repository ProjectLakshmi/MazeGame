<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMazeGame } from '@/composables/useMazeGame'

const props = defineProps({ startLevel: { type: Number, default: 0 } })
const emit = defineEmits(['backToLevelSelect'])

const {
  canvasEl,
  currentLevelIndex,
  joystickBase,
  knobPosition,
  levelCompleteInfo,
  continueToNextLevel,
  soundEnabled,
  toggleSound,
  startGame,
  stopGame,
  handleJoystickStart,
  handleJoystickMove,
  handleJoystickEnd,
} = useMazeGame()

const confettiPieces = ref([])
const colors = ['#2df5c9', '#7b2ff7', '#0dd3c4', '#ff5f3a', '#7ffcec']

function burstConfetti() {
  confettiPieces.value = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.4 + Math.random() * 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
  }))
  setTimeout(() => { confettiPieces.value = [] }, 2500)
}

watch(levelCompleteInfo, (newVal) => {
  if (newVal) burstConfetti()
})

onMounted(() => startGame(props.startLevel))
onUnmounted(stopGame)
</script>

<template>
  <div class="header-row">
    <button class="back-btn" @click="emit('backToLevelSelect')">← Levels</button>
    <button class="sound-btn" @click="toggleSound">{{ soundEnabled ? '🔊' : '🔇' }}</button>
  </div>
  <h2>Level {{ currentLevelIndex + 1 }}</h2>

  <div class="canvas-wrap">
    <canvas ref="canvasEl"></canvas>

    <div class="confetti-layer">
      <span
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece"
        :style="{
          left: piece.left + '%',
          backgroundColor: piece.color,
          animationDelay: piece.delay + 's',
          animationDuration: piece.duration + 's',
          transform: `rotate(${piece.rotation}deg)`,
        }"
      ></span>
    </div>
  </div>

  <div
    class="joystick-base"
    ref="joystickBase"
    @touchstart.prevent="handleJoystickStart"
    @touchmove.prevent="handleJoystickMove"
    @touchend.prevent="handleJoystickEnd"
    @mousedown="handleJoystickStart"
    @mousemove="handleJoystickMove"
    @mouseup="handleJoystickEnd"
    @mouseleave="handleJoystickEnd"
  >
    <div
      class="joystick-knob"
      :style="{ transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)` }"
    ></div>
  </div>

  <div v-if="levelCompleteInfo" class="modal-backdrop">
    <div class="modal">
      <h2>Level Complete!</h2>
      <p class="stars-display">
        <span v-for="n in 3" :key="n" :class="{ filled: n <= levelCompleteInfo.stars }">★</span>
      </p>
      <p class="stats">{{ levelCompleteInfo.moves }} moves · {{ levelCompleteInfo.seconds.toFixed(1) }}s</p>
      <div class="modal-actions">
        <button class="secondary" @click="emit('backToLevelSelect')">Level Select</button>
        <button class="primary" @click="continueToNextLevel">Next Level →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=JetBrains+Mono:wght@400&display=swap');
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.back-btn { background: none; border: none; color: #8a97a8; cursor: pointer; }
.sound-btn {
  background: none;
  border: 1px solid #2a3340;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
}
.canvas-wrap { position: relative; display: flex; justify-content: center; }
.canvas-wrap canvas { border: 2px solid black; max-width: 100%; height: auto; }
.joystick-base {
  width: 120px; height: 120px; border-radius: 50%;
  background: rgba(42, 51, 64, 0.15); border: 2px solid rgba(42, 51, 64, 0.3);
  margin: 24px auto; position: relative; touch-action: none;
}
.joystick-knob {
  width: 50px; height: 50px; border-radius: 50%; background: #2a3340;
  position: absolute; top: 35px; left: 35px; transition: transform 0.05s linear;
}
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.modal {
  background: #1a212c; border-radius: 12px; padding: 28px 32px;
  text-align: center; color: #e7ebf0; font-family: 'Space Grotesk', sans-serif;
}
.stars-display { font-size: 32px; color: #2a3340; margin: 8px 0; }
.stars-display .filled { color: #52e3a4; }
.stats { color: #8a97a8; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.modal-actions button { padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
.primary { background: #52e3a4; color: #0d1710; }
.secondary { background: transparent; border: 1px solid #2a3340 !important; color: #e7ebf0; }

.confetti-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall linear forwards;
}
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(280px) rotate(360deg); opacity: 0; }
}
</style>