<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useMazeGame } from '@/composables/useMazeGame'

const {
  canvasEl,
  currentLevelIndex,
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
  <h2>Level {{ currentLevelIndex + 1 }}</h2>

  <div class="canvas-wrap">
    <canvas ref="canvasEl"></canvas>
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
</template>

<style scoped>
.canvas-wrap { display: flex; justify-content: center; }
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
</style>