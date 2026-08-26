export function useSwipeMove(onMove, { stepThreshold = 24, holdRepeatMs = 90 } = {}) {
  let lastPoint = { x: 0, y: 0 }
  let holdDirection = { row: 0, col: 0 }
  let holdIntervalId = null

  function handleTouchStart(event) {
    const touch = event.touches ? event.touches[0] : event
    lastPoint = { x: touch.clientX, y: touch.clientY }
    holdDirection = { row: 0, col: 0 }
    if (holdIntervalId) {
      clearInterval(holdIntervalId)
      holdIntervalId = null
    }
  }

  function handleTouchMove(event) {
    const touch = event.touches ? event.touches[0] : event
    const deltaX = touch.clientX - lastPoint.x
    const deltaY = touch.clientY - lastPoint.y
    const distance = Math.hypot(deltaX, deltaY)

    if (distance < stepThreshold) return

    const direction =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX > 0 ? { row: 0, col: 1 } : { row: 0, col: -1 })
        : (deltaY > 0 ? { row: 1, col: 0 } : { row: -1, col: 0 })

    onMove(direction.row, direction.col)
    holdDirection = direction

    // Reset reference point to the CURRENT touch so continued swiping
    // keeps stepping smoothly instead of only firing once
    lastPoint = { x: touch.clientX, y: touch.clientY }

    if (holdIntervalId) clearInterval(holdIntervalId)
    holdIntervalId = setInterval(() => {
      onMove(holdDirection.row, holdDirection.col)
    }, holdRepeatMs)
  }

  function handleTouchEnd() {
    if (holdIntervalId) {
      clearInterval(holdIntervalId)
      holdIntervalId = null
    }
    holdDirection = { row: 0, col: 0 }
  }

  function stopSwipe() {
    if (holdIntervalId) {
      clearInterval(holdIntervalId)
      holdIntervalId = null
    }
  }

  return { handleTouchStart, handleTouchMove, handleTouchEnd, stopSwipe }
}