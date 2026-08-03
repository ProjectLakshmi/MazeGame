<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useMazeGame } from '@/composables/useMazeGame'

const {
  canvasEl,
  currentLevelIndex,
  floodPercent,
  caughtMessage,
  joystickBase,
  knobPosition,
  startGame,
  stopGame,
  handleJoystickStart,
  handleJoystickMove,
  handleJoystickEnd,
} = useMazeGame()

onMounted(startGame)
onUnmounted(stopGame)
</script>

<template>
  <div class="ruins">
    <div class="hud">
      <span class="hud__level">LEVEL {{ String(currentLevelIndex + 1).padStart(2, '0') }}</span>
      <div class="hud__flood">
        <span class="hud__flood-label">FLOOD</span>
        <div class="hud__flood-track">
          <div class="hud__flood-fill" :style="{ width: floodPercent + '%' }"></div>
        </div>
        <span class="hud__flood-value">{{ floodPercent }}%</span>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas ref="canvasEl"></canvas>
      <transition name="fade">
        <div v-if="caughtMessage" class="toast">{{ caughtMessage }}</div>
      </transition>
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
  </div>
</template>

<style scoped>
.ruins {
  --void: #05070b;
  --stone: #131b26;
  --circuit: #2df5c9;
  --warn: #ff5f3a;
  --flood: #0dd3c4;
  --violet: #7b2ff7;
  --bone: #d8e4e8;

  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 16px 32px;
  background: radial-gradient(circle at 50% 0%, #0d1420 0%, var(--void) 65%);
  color: var(--bone);
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
}

.hud {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hud__level {
  font-size: 13px;
  letter-spacing: 0.14em;
  color: var(--circuit);
  text-shadow: 0 0 8px rgba(45, 245, 201, 0.55);
}

.hud__flood {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
}

.hud__flood-label {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: rgba(216, 228, 232, 0.55);
}

.hud__flood-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(45, 245, 201, 0.2);
  overflow: hidden;
}

.hud__flood-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--violet), var(--flood));
  box-shadow: 0 0 10px rgba(13, 211, 196, 0.7);
  transition: width 0.15s linear;
}

.hud__flood-value {
  font-size: 11px;
  color: var(--flood);
  min-width: 32px;
  text-align: right;
}

.canvas-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(45, 245, 201, 0.08), rgba(123, 47, 247, 0.06));
  border: 1px solid rgba(45, 245, 201, 0.25);
  box-shadow: 0 0 24px rgba(45, 245, 201, 0.12), inset 0 0 30px rgba(0, 0, 0, 0.5);
}

.canvas-wrap canvas {
  border-radius: 6px;
  max-width: 100%;
  height: auto;
  display: block;
}

.toast {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px 18px;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bone);
  background: rgba(5, 7, 11, 0.55);
  text-shadow: 0 0 10px rgba(255, 95, 58, 0.8);
  border-radius: 6px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.joystick-base {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(45, 245, 201, 0.08), rgba(5, 7, 11, 0.4));
  border: 2px solid rgba(45, 245, 201, 0.35);
  box-shadow: 0 0 18px rgba(45, 245, 201, 0.18);
  margin: 8px auto 0;
  position: relative;
  touch-action: none;
}

.joystick-knob {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #7ffcec, var(--circuit) 70%);
  box-shadow: 0 0 16px rgba(45, 245, 201, 0.85);
  position: absolute;
  top: 35px;
  left: 35px;
  transition: transform 0.05s linear;
}
</style>
