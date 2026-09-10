<script setup>
import { ref, onMounted } from 'vue'
import { fetchLeaderboard } from '@/api/gameApi'

const emit = defineEmits(['back'])

const entries = ref([])
const loading = ref(true)
const error = ref('')

async function loadLeaderboard() {
  loading.value = true
  error.value = ''
  try {
    entries.value = await fetchLeaderboard()
  } catch (e) {
    error.value = 'Could not load leaderboard. Try again later.'
  } finally {
    loading.value = false
  }
}

function formatTime(ms) {
  return (ms / 1000).toFixed(2) + 's'
}

function medal(index) {
  return ['🥇', '🥈', '🥉'][index] || `${index + 1}.`
}

onMounted(loadLeaderboard)
</script>

<template>
  <div class="leaderboard-wrap">
    <h1>🏆 Leaderboard</h1>

    <p v-if="loading" class="status">Loading...</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <p v-else-if="entries.length === 0" class="status">No races finished yet. Be the first!</p>

    <ol v-else class="leaderboard-list">
      <li v-for="(entry, i) in entries" :key="i" class="entry-row">
        <span class="rank">{{ medal(i) }}</span>
        <span class="name">{{ entry.name }}</span>
        <span class="time">{{ formatTime(entry.finishTimeMs) }}</span>
      </li>
    </ol>

    <button class="refresh" @click="loadLeaderboard" :disabled="loading">Refresh</button>
    <button class="back" @click="emit('back')">Back</button>
  </div>
</template>

<style scoped>
.leaderboard-wrap {
  max-width: 480px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  font-family: 'Space Grotesk', sans-serif;
}
.status { color: #8a97a8; margin: 2rem 0; }
.status.error { color: #e35252; }

.leaderboard-list { list-style: none; padding: 0; margin: 1.5rem 0; }
.entry-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  background: #171d26;
  border: 1px solid #2a3340;
  color: #e7ebf0;
}
.rank { width: 2.5rem; text-align: left; }
.name { flex: 1; text-align: left; }
.time { color: #52e3a4; font-family: 'JetBrains Mono', monospace; }

button { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; margin: 0.3rem; }
.refresh { background: #2a3340; color: #e7ebf0; }
.back { background: #52e3a4; color: #0d1710; }
</style>