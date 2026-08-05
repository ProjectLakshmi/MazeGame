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
  // Reload so every screen re-reads fresh (empty) state instead of
  // holding onto stale in-memory values from before the reset.
  window.location.reload()
}
</script>

<template>
  <div class="settings">
    <button class="back-btn" @click="emit('back')">← Back</button>
    <h1>Settings</h1>

    <div class="row">
      <span>Sound</span>
      <button class="toggle" @click="toggleSound">{{ soundEnabled ? 'On 🔊' : 'Off 🔇' }}</button>
    </div>

    <div class="row">
      <span>Progress</span>
      <button class="danger" @click="showResetConfirm = true">Reset All Progress</button>
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
.settings {
  min-height: 100vh; background: #10141b; color: #e7ebf0; padding: 24px;
  font-family: 'Space Grotesk', sans-serif;
}
.back-btn { background: none; border: none; color: #8a97a8; font-size: 14px; cursor: pointer; }
h1 { margin: 12px 0 24px; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  max-width: 360px; padding: 14px 0; border-bottom: 1px solid #2a3340;
}
.toggle {
  background: none; border: 1px solid #2a3340; border-radius: 6px;
  color: #e7ebf0; padding: 6px 14px; cursor: pointer;
}
.danger {
  background: #ff5f3a; border: none; border-radius: 6px;
  color: #10141b; padding: 6px 14px; cursor: pointer; font-weight: 600;
}
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.modal {
  background: #1a212c; border-radius: 12px; padding: 24px 28px;
  max-width: 320px; text-align: center;
}
.modal p { font-size: 14px; color: #b8c0cc; margin-bottom: 18px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }
.secondary {
  background: transparent; border: 1px solid #2a3340; color: #e7ebf0;
  border-radius: 6px; padding: 8px 16px; cursor: pointer;
}
</style>