import { ref } from 'vue'

export function useJoystick(onMove, { radius = 50, deadZone = 6, repeatMs = 130 } = {}) {
  const joystickBase = ref(null)
  const knobPosition = ref({ x: 0, y: 0 })

  let joystickCenter = { x: 0, y: 0 }
  let currentDirection = { row: 0, col: 0 }
  let lastMovedDirection = { row: 0, col: 0 }
  let joystickMoveIntervalId = null

  function handleJoystickStart(event) {
    const rect = joystickBase.value.getBoundingClientRect()
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    updateJoystick(event)

    if (joystickMoveIntervalId) clearInterval(joystickMoveIntervalId)
    joystickMoveIntervalId = setInterval(() => {
      if (currentDirection.row !== 0 || currentDirection.col !== 0) {
        onMove(currentDirection.row, currentDirection.col)
      }
    }, repeatMs)
  }

  function handleJoystickMove(event) {
    updateJoystick(event)
  }

  function updateJoystick(event) {
    const touch = event.touches ? event.touches[0] : event
    const deltaX = touch.clientX - joystickCenter.x
    const deltaY = touch.clientY - joystickCenter.y

    const distance = Math.min(Math.hypot(deltaX, deltaY), radius)
    const angle = Math.atan2(deltaY, deltaX)
    knobPosition.value = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }

    if (distance < deadZone) {
      currentDirection = { row: 0, col: 0 }
      return
    }

    const newDirection =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX > 0 ? { row: 0, col: 1 } : { row: 0, col: -1 })
        : (deltaY > 0 ? { row: 1, col: 0 } : { row: -1, col: 0 })

    currentDirection = newDirection

    const directionChanged =
      newDirection.row !== lastMovedDirection.row || newDirection.col !== lastMovedDirection.col
    if (directionChanged) {
      onMove(newDirection.row, newDirection.col)
      lastMovedDirection = { ...newDirection }
    }
  }

  function handleJoystickEnd() {
    if (joystickMoveIntervalId) {
      clearInterval(joystickMoveIntervalId)
      joystickMoveIntervalId = null
    }
    currentDirection = { row: 0, col: 0 }
    lastMovedDirection = { row: 0, col: 0 }
    knobPosition.value = { x: 0, y: 0 }
  }

  function stopJoystick() {
    if (joystickMoveIntervalId) clearInterval(joystickMoveIntervalId)
  }

  return {
    joystickBase,
    knobPosition,
    handleJoystickStart,
    handleJoystickMove,
    handleJoystickEnd,
    stopJoystick,
  }
}