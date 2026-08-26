<script setup>
import { computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { useRaceGame } from '@/composables/useRaceGame'

const props = defineProps({
  raceInfo: { type: Object, required: true },
})
const emit = defineEmits(['exit'])

const race = inject('race')

const {
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
} = useRaceGame(race)

const seconds = computed(() => (elapsedMs.value / 1000).toFixed(1))
const myFinishSeconds = computed(() => (myFinishTime.value != null ? (myFinishTime.value / 1000).toFixed(1) : null))

const rankedResults = computed(() => race.rankings.value)
const waitingOnOthers = computed(() => phase.value === 'finished' && race.raceState.value !== 'finished')

function handleExit() {
  stopRaceGame()
  race.disconnect()
  emit('exit')
}

onMounted(() => {
  startRaceGame(props.raceInfo)
})

onUnmounted(() => {
  stopRaceGame()
})

// If the connection drops mid-race, don't leave the player stuck on a dead screen
watch(() => race.connectionState.value, (state) => {
  if (state === 'disconnected' && phase.value !== 'finished') {
    handleExit()
  }
})
</script>

<template>
  <div class="race-wrap">
    <div class="header-row">
      <span class="timer">{{ phase === 'racing' || phase === 'finished' ? seconds + 's' : '' }}</span>
      <span class="room-code-tag">Room {{ raceInfo.roomCode }}</span>
    </div>

    <div
      class="canvas-wrap"
      @touchstart.prevent="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend.prevent="handleTouchEnd"
    >
      <canvas ref="canvasEl"></canvas>

      <div v-if="phase === 'countdown'" class="countdown-overlay">
        <span class="countdown-text">{{ countdownText }}</span>
      </div>
    </div>

    <div v-if="phase === 'finished'" class="modal-backdrop">
      <div class="modal">
        <h2>{{ waitingOnOthers ? 'You Finished!' : 'Race Over!' }}</h2>
        <p v-if="myFinishSeconds" class="stats">Your time: {{ myFinishSeconds }}s</p>

        <div v-if="waitingOnOthers" class="waiting">
          <p class="hint">Waiting for other racers to finish...</p>
        </div>

        <ol v-else class="rankings">
          <li v-for="(p, i) in rankedResults" :key="p.connectionId" class="rank-row">
            <span class="rank-medal">{{ ['🥇', '🥈', '🥉'][i] || (i + 1) + '.' }}</span>
            <span class="rank-name">{{ p.name }}</span>
            <span class="rank-time">{{ (p.finishTimeMs / 1000).toFixed(1) }}s</span>
          </li>
        </ol>

        <button class="primary" @click="handleExit">Back to Home</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap');

.race-wrap {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 0%, #161d27, #0c0f14 60%);
  color: #e7ebf0;
  font-family: 'Space Grotesk', sans-serif;
  padding: 16px;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #8a97a8;
}
.timer { color: #52e3a4; font-weight: 700; font-size: 16px; }

.canvas-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  touch-action: none;
}
.canvas-wrap canvas { border: 2px solid #2a3340; max-width: 100%; height: auto; border-radius: 8px; }

.countdown-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(12, 15, 20, 0.55);
  border-radius: 8px;
}
.countdown-text {
  font-size: 64px;
  font-weight: 700;
  color: #52e3a4;
  text-shadow: 0 0 24px rgba(82, 227, 164, 0.6);
}

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.modal {
  background: #1a212c; border-radius: 12px; padding: 28px 32px;
  text-align: center; color: #e7ebf0; min-width: 260px;
}
.stats { color: #8a97a8; font-family: 'JetBrains Mono', monospace; font-size: 13px; margin: 6px 0 16px; }
.hint { color: #8a97a8; font-family: 'JetBrains Mono', monospace; font-size: 13px; }

.rankings { list-style: none; padding: 0; margin: 8px 0 20px; display: flex; flex-direction: column; gap: 8px; }
.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #171d26;
  border: 1px solid #2a3340;
  border-radius: 8px;
  padding: 8px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}
.rank-medal { width: 24px; }
.rank-name { flex: 1; text-align: left; }
.rank-time { color: #52e3a4; }

.primary { background: #52e3a4; color: #0d1710; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
.room-code-tag { letter-spacing: 1px; }
</style>