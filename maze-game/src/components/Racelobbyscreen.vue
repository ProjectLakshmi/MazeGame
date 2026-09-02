<script setup>
import { ref, computed, watch, inject, onUnmounted } from 'vue'

const emit = defineEmits(['back', 'raceStarting'])

const {
  roomCode,
  players,
  isHost,
  myConnectionId,
  joinError,
  raceState,
  raceSeed,
  raceDims,
  raceStartUtc,
  createRoom,
  joinRoom,
  toggleReady,
  startRace,
  disconnect,
} = inject('race')

const playerName = ref(localStorage.getItem('mazeRacePlayerName') || '')
const joinCodeInput = ref('')
const view = ref('choose') // 'choose' | 'lobby'
const busy = ref(false)

const me = computed(() => players.value.find((p) => p.connectionId === myConnectionId.value))
const allReady = computed(() => players.value.length > 0 && players.value.every((p) => p.ready))

async function handleCreate() {
  if (!playerName.value.trim()) return
  localStorage.setItem('mazeRacePlayerName', playerName.value)
  busy.value = true
  try {
    await createRoom(playerName.value)
    view.value = 'lobby'
  } finally {
    busy.value = false
  }
}

async function handleJoin() {
  if (!playerName.value.trim() || !joinCodeInput.value.trim()) return
  localStorage.setItem('mazeRacePlayerName', playerName.value)
  busy.value = true
  try {
    await joinRoom(joinCodeInput.value, playerName.value)
    view.value = 'lobby'
  } finally {
    busy.value = false
  }
}

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(roomCode.value)
  } catch {
    // clipboard unavailable — code is still visible to read/share manually
  }
}

function handleBack() {
  disconnect()
  emit('back')
}

watch(raceState, (state) => {
  if (state === 'countdown') {
    emit('raceStarting', {
      seed: raceSeed.value,
      roomsWide: raceDims.value.roomsWide,
      roomsHigh: raceDims.value.roomsHigh,
      raceStartUtc: raceStartUtc.value,
      roomCode: roomCode.value,
    })
  }
})

onUnmounted(() => {
  if (raceState.value !== 'countdown' && raceState.value !== 'racing') disconnect()
})
</script>

<template>
  <div class="lobby-wrap">
    <button class="back-btn" @click="handleBack">← Back</button>
    <h1>Race Mode</h1>

    <div v-if="view === 'choose'" class="choose-panel">
      <label class="field">
        Your name
        <input v-model="playerName" maxlength="16" placeholder="Racer" />
      </label>

      <button class="primary" :disabled="busy || !playerName.trim()" @click="handleCreate">
        Create Room
      </button>

      <div class="divider">or</div>

      <label class="field">
        Room code
        <input v-model="joinCodeInput" maxlength="5" placeholder="ABCDE" style="text-transform: uppercase" />
      </label>
      <button class="secondary" :disabled="busy || !playerName.trim() || !joinCodeInput.trim()" @click="handleJoin">
        Join Room
      </button>

      <p v-if="joinError" class="error">{{ joinError }}</p>
    </div>

    <div v-else class="lobby-panel">
      <div class="room-code-box">
        <span class="room-code-label">Room Code</span>
        <div class="room-code-row">
          <span class="room-code">{{ roomCode }}</span>
          <button class="ghost small" @click="copyRoomCode">Copy</button>
        </div>
      </div>

      <ul class="player-list">
        <li v-for="p in players" :key="p.connectionId" class="player-row">
          <span class="player-name">{{ p.name }}</span>
          <span class="ready-badge" :class="{ ready: p.ready }">
            {{ p.ready ? 'Ready' : 'Not Ready' }}
          </span>
        </li>
      </ul>

      <button class="secondary" @click="toggleReady">
        {{ me?.ready ? 'Cancel Ready' : 'I\'m Ready' }}
      </button>

      <button
        v-if="isHost"
        class="primary"
        :disabled="!allReady"
        @click="startRace"
      >
        {{ allReady ? 'Start Race' : 'Waiting for everyone to be ready...' }}
      </button>
      <p v-else class="hint">Waiting for the host to start the race...</p>

      <p v-if="joinError" class="error">{{ joinError }}</p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap');

.lobby-wrap {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 0%, #161d27, #0c0f14 60%);
  color: #e7ebf0;
  padding: 24px;
  font-family: 'Space Grotesk', sans-serif;
  text-align: center;
}
.back-btn { background: none; border: none; color: #8a97a8; font-size: 14px; cursor: pointer; float: left; }
h1 { margin: 8px 0 24px; }

.choose-panel, .lobby-panel {
  max-width: 340px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  font-size: 12px;
  color: #8a97a8;
  font-family: 'JetBrains Mono', monospace;
}
.field input {
  background: #171d26;
  border: 1px solid #2a3340;
  border-radius: 8px;
  padding: 10px 12px;
  color: #e7ebf0;
  font-size: 15px;
  font-family: 'Space Grotesk', sans-serif;
}

button { padding: 12px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; }
.primary { background: #52e3a4; color: #0d1710; }
.primary:disabled { opacity: 0.4; cursor: not-allowed; }
.secondary { background: transparent; border: 1px solid #2a3340; color: #e7ebf0; }
.ghost { background: transparent; border: 1px solid #2a3340; color: #e7ebf0; }
.ghost.small { padding: 6px 10px; font-size: 12px; }

.divider { color: #4a5568; font-size: 12px; margin: 4px 0; }

.room-code-box {
  background: #171d26;
  border: 1px solid #2a3340;
  border-radius: 10px;
  padding: 14px;
}
.room-code-label { font-size: 11px; color: #8a97a8; font-family: 'JetBrains Mono', monospace; }
.room-code-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 6px; }
.room-code { font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #52e3a4; font-family: 'JetBrains Mono', monospace; }

.player-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #171d26;
  border: 1px solid #2a3340;
  border-radius: 8px;
  padding: 10px 14px;
}
.ready-badge {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: #8a97a8;
  padding: 3px 8px;
  border-radius: 6px;
  background: #0d1218;
}
.ready-badge.ready { color: #0d1710; background: #52e3a4; }

.hint { font-size: 13px; color: #8a97a8; font-family: 'JetBrains Mono', monospace; }
.error { color: #ff5f3a; font-size: 13px; font-family: 'JetBrains Mono', monospace; }
</style>