<script setup>
import { ref } from 'vue'
import { useSaveData } from '@/composables/useSaveData'

const emit = defineEmits(['back'])
const { getSettings, saveSettings, resetAll } = useSaveData()

const soundEnabled = ref(getSettings().soundEnabled)
const showResetConfirm = ref(false)

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  saveSettings({ ...getSettings(), soundEnabled: soundEnabled.value })
}

function confirmReset() {
  resetAll()
  showResetConfirm.value = false
  window.location.reload()
}
</script>

<template>
  <div class="settings">
    <button class="back-btn" @click="emit('back')">← Back</button>
    <h1>Settings</h1>

    <div class="settings-panel">
      <div class="row">
        <span>Sound</span>
        <button class="toggle" :class="{ active: soundEnabled }" @click="toggleSound">
          {{ soundEnabled ? 'On 🔊' : 'Off 🔇' }}
        </button>
      </div>

      <div class="row">
        <span>Progress</span>
        <button class="danger" @click="showResetConfirm = true">Reset All Progress</button>
      </div>
    </div>

    <div v-if="showResetConfirm" class="modal-backdrop">
      <div class="modal">
        <p>This will permanently erase all level stars and unlocks. This can't be undone.</p>
        <div class="modal-actions">
          <button class="secondary" @click="showResetConfirm = false">Cancel</button>
          <button class="danger" @click="confirmReset">Reset Everything</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap');

.settings {
  min-height: 100vh;
  background: #10141b;
  color: #e7ebf0;
  padding: 24px;
  font-family: 'Space Grotesk', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.back-btn {
  background: none;
  border: none;
  color: #8a97a8;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-start;
}
h1 {
  margin: 12px 0 24px;
  letter-spacing: -0.01em;
}

.settings-panel {
  width: 100%;
  max-width: 360px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 4px;
  border-bottom: 1px solid #2a3340;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}
.row:last-child {
  border-bottom: none;
}

.toggle {
  font-family: 'JetBrains Mono', monospace;
  background: none;
  border: 1px solid #2a3340;
  border-radius: 6px;
  color: #8a97a8;
  padding: 6px 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.toggle.active {
  border-color: #52e3a4;
  color: #52e3a4;
  background: rgba(82, 227, 164, 0.08);
}

.danger {
  font-family: 'JetBrains Mono', monospace;
  background: #ff5f3a;
  border: none;
  border-radius: 6px;
  color: #10141b;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: filter 0.15s ease;
}
.danger:hover {
  filter: brightness(1.08);
}
.danger:active {
  transform: scale(0.97);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.modal {
  background: #1a212c;
  border: 1px solid #2a3340;
  border-radius: 12px;
  padding: 24px 28px;
  max-width: 320px;
  text-align: center;
}
.modal p {
  font-size: 14px;
  color: #b8c0cc;
  margin-bottom: 18px;
  font-family: 'Space Grotesk', sans-serif;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.secondary {
  font-family: 'JetBrains Mono', monospace;
  background: transparent;
  border: 1px solid #2a3340;
  color: #e7ebf0;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.secondary:hover {
  border-color: #8a97a8;
}
</style>