import { ref } from 'vue'
import { useSaveData } from './useSaveData'

export function useSound() {
  const { getSettings, saveSettings } = useSaveData()

  const soundEnabled = ref(getSettings().soundEnabled)
  let audioCtx = null

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    saveSettings({ ...getSettings(), soundEnabled: soundEnabled.value })
  }

  function playTone(frequency, durationMs, type = 'sine', volume = 0.15) {
    if (!soundEnabled.value) return
    const ctx = getAudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + durationMs / 1000)
  }

  function playMoveSound() {
    playTone(320, 60, 'sine', 0.08)
  }

  function playCaughtSound() {
    playTone(180, 90, 'square', 0.18)
    setTimeout(() => playTone(110, 160, 'square', 0.16), 90)
  }

  function playLevelCompleteSound() {
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 180, 'triangle', 0.14), i * 90)
    })
  }

  function playFloodWarningSound() {
    playTone(220, 300, 'sine', 0.1)
  }

  return {
    soundEnabled,
    toggleSound,
    playMoveSound,
    playCaughtSound,
    playLevelCompleteSound,
    playFloodWarningSound,
  }
}