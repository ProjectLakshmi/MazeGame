<script setup>
import { computed } from 'vue'
import { useMazeGame } from '@/composables/useMazeGame'
import { useSaveData } from '@/composables/useSaveData'

const emit = defineEmits(['selectLevel', 'back'])

const { TOTAL_LEVELS, isLevelUnlocked } = useMazeGame()
const { getProgress } = useSaveData()

const results = computed(() => getProgress())
const levels = computed(() =>
  Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
    index: i,
    unlocked: isLevelUnlocked(i,results.value),
    stars: results.value[i]?.stars ?? 0,
  }))
)


const totalStars = computed(() =>
  levels.value.reduce((sum, l) => sum + l.stars, 0)
)
const maxStars = computed(() => TOTAL_LEVELS * 3)


const nextLevelIndex = computed(() => {
  const found = levels.value.find((l) => l.unlocked && l.stars === 0)
  return found ? found.index : -1
})
</script>

<template>
  <div class="level-select">
    <button class="back-btn" @click="$emit('back')">← Back</button>
    <h1>Select Level</h1>

    <div class="progress-summary">
      <span class="progress-stars">★ {{ totalStars }} / {{ maxStars }}</span>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (totalStars / maxStars) * 100 + '%' }"></div>
      </div>
    </div>

    <div class="grid">
      <button
        v-for="level in levels"
        :key="level.index"
        class="level-tile"
        :class="{
          locked: !level.unlocked,
          completed: level.stars > 0,
          next: level.index === nextLevelIndex,
        }"
        :disabled="!level.unlocked"
        @click="$emit('selectLevel', level.index)"
      >
        <span v-if="!level.unlocked" class="lock-icon">🔒</span>
        <template v-else>
          <span class="level-number">{{ level.index + 1 }}</span>
          <span class="stars">
            <span v-for="n in 3" :key="n" :class="{ filled: n <= level.stars }">★</span>
          </span>
          <span v-if="level.index === nextLevelIndex" class="next-badge">PLAY</span>
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap');

.level-select {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 0%, #161d27, #0c0f14 60%);
  color: #e7ebf0;
  padding: 24px;
  font-family: 'Space Grotesk', sans-serif;
  text-align: center;
}
.back-btn {
  background: none;
  border: none;
  color: #8a97a8;
  font-size: 14px;
  cursor: pointer;
  float: left;
}
h1 {
  margin: 8px 0 16px;
  letter-spacing: 0.5px;
}

/* ADDED — progress summary */
.progress-summary {
  max-width: 320px;
  margin: 0 auto 28px;
}
.progress-stars {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #52e3a4;
  display: block;
  margin-bottom: 6px;
}
.progress-bar {
  height: 6px;
  border-radius: 4px;
  background: #1a212c;
  border: 1px solid #2a3340;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2fa87c, #52e3a4);
  transition: width 0.4s ease;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 14px;
  max-width: 420px;
  margin: 0 auto;
}

.level-tile {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid #2a3340;
  background: linear-gradient(160deg, #1e2632, #151b24 70%);
  color: #e7ebf0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.12s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.level-tile:not(.locked):hover {
  transform: translateY(-2px);
  border-color: rgba(82, 227, 164, 0.4);
}
.level-tile:not(.locked):active {
  transform: translateY(0) scale(0.97);
}

.level-tile.locked {
  opacity: 0.35;
  cursor: not-allowed;
  background: #14181f;
}

/* ADDED — completed levels get a subtle green-tinted border */
.level-tile.completed {
  border-color: rgba(82, 227, 164, 0.25);
}

/* ADDED — the "next to play" tile pulses to draw the eye */
.level-tile.next {
  border-color: #52e3a4;
  animation: next-pulse 2s ease-in-out infinite;
}
@keyframes next-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(82, 227, 164, 0); }
  50% { box-shadow: 0 0 16px rgba(82, 227, 164, 0.45); }
}
.next-badge {
  position: absolute;
  bottom: -8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: #52e3a4;
  color: #0d1710;
  padding: 2px 6px;
  border-radius: 4px;
}

.level-number {
  font-size: 20px;
  font-weight: 700;
}
.stars {
  font-size: 12px;
  color: #2a3340;
}
.stars .filled {
  color: #52e3a4;
}
.lock-icon {
  font-size: 20px;
  opacity: 0.7;
}
</style>