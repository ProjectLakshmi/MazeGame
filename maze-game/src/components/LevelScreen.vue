<script setup>
import { computed } from 'vue'
import { useMazeGame } from '@/composables/useMazeGame'

const emit = defineEmits(['selectLevel', 'back'])

// We only need the read-only helpers here, not the full game state
const { TOTAL_LEVELS, getLevelResults, isLevelUnlocked } = useMazeGame()

const results = computed(() => getLevelResults())
const levels = computed(() =>
  Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
    index: i,
    unlocked: isLevelUnlocked(i),
    stars: results.value[i]?.stars ?? 0,
  }))
)
</script>

<template>
  <div class="level-select">
    <button class="back-btn" @click="$emit('back')">← Back</button>
    <h1>Select Level</h1>

    <div class="grid">
      <button
        v-for="level in levels"
        :key="level.index"
        class="level-tile"
        :class="{ locked: !level.unlocked }"
        :disabled="!level.unlocked"
        @click="$emit('selectLevel', level.index)"
      >
        <span v-if="!level.unlocked" class="lock-icon">🔒</span>
        <template v-else>
          <span class="level-number">{{ level.index + 1 }}</span>
          <span class="stars">
            <span v-for="n in 3" :key="n" :class="{ filled: n <= level.stars }">★</span>
          </span>
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.level-select {
  min-height: 100vh;
  background: #10141b;
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
  margin: 8px 0 24px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  max-width: 420px;
  margin: 0 auto;
}
.level-tile {
  aspect-ratio: 1;
  border-radius: 10px;
  border: 1px solid #2a3340;
  background: #1a212c;
  color: #e7ebf0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
}
.level-tile.locked {
  opacity: 0.4;
  cursor: not-allowed;
}
.level-number {
  font-size: 18px;
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
}
</style>