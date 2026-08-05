const TILE_RADIUS = 6

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawWallEdges(ctx, level, CELL, timestamp, brightness, theme) {
  for (let row = 0; row < level.maze.length; row++) {
    for (let col = 0; col < level.maze[row].length; col++) {
      if (level.maze[row][col] !== 1) continue
      const x = col * CELL
      const y = row * CELL
      const flicker = 0.35 + Math.abs(Math.sin(timestamp / 900 + row * 3 + col * 7)) * 0.2
      ctx.strokeStyle = hexToRgba(theme.accent, Math.min(1, flicker * brightness))
      ctx.lineWidth = 2
      roundedRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, TILE_RADIUS)
      ctx.stroke()
    }
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function drawTiles(ctx, level, CELL, theme) {
  for (let row = 0; row < level.maze.length; row++) {
    for (let col = 0; col < level.maze[row].length; col++) {
      const x = col * CELL
      const y = row * CELL
      const isWall = level.maze[row][col] === 1

      const gradient = ctx.createLinearGradient(x, y, x, y + CELL)
      if (isWall) {
        gradient.addColorStop(0, theme.wallTop)
        gradient.addColorStop(1, theme.wallBottom)
      } else {
        gradient.addColorStop(0, theme.floorTop)
        gradient.addColorStop(1, theme.floorBottom)
      }
      ctx.fillStyle = gradient
      roundedRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, TILE_RADIUS)
      ctx.fill()
    }
  }
}

export function drawExit(ctx, level, CELL, timestamp, theme) {
  const exitX = level.exit.col * CELL + CELL / 2
  const exitY = level.exit.row * CELL + CELL / 2
  const pulse = 10 + Math.sin(timestamp / 260) * 4
  ctx.save()
  ctx.shadowColor = theme.accent
  ctx.shadowBlur = pulse
  ctx.fillStyle = theme.accent
  ctx.beginPath()
  ctx.arc(exitX, exitY, CELL / 2 - 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawFlood(ctx, level, CELL, canvasWidth, timestamp, front, theme, drawWallEdgesFn) {
  const floodBoundaryY = (front + 1) * CELL
  if (floodBoundaryY <= 0) return

  ctx.save()
  ctx.globalAlpha = 0.4
  const gradient = ctx.createLinearGradient(0, 0, 0, floodBoundaryY)
  gradient.addColorStop(0, theme.floodFrom)
  gradient.addColorStop(1, theme.floodTo)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, floodBoundaryY)
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = theme.accent
  ctx.lineWidth = 2
  ctx.shadowColor = theme.accent
  ctx.shadowBlur = 10
  ctx.beginPath()
  for (let x = 0; x <= canvasWidth; x += 6) {
    const wave = Math.sin(x / 22 + timestamp / 260) * 3
    const yy = floodBoundaryY + wave
    if (x === 0) ctx.moveTo(x, yy)
    else ctx.lineTo(x, yy)
  }
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, canvasWidth, floodBoundaryY)
  ctx.clip()
  drawWallEdgesFn(1.8)
  ctx.restore()
}

export function getSquashStretch(moveAnimStartTime, timestamp) {
  const elapsed = timestamp - moveAnimStartTime
  const duration = 180
  if (elapsed < 0 || elapsed > duration) return { scaleX: 1, scaleY: 1 }

  const t = elapsed / duration
  const bounce = Math.sin(t * Math.PI) * 0.18 // peak squash amount
  return { scaleX: 1 + bounce, scaleY: 1 - bounce }
}

export function drawSprite(ctx, img, row, col, facingLeft, glowColor, timestamp, CELL, SPRITE_SIZE, squash = { scaleX: 1, scaleY: 1 }) {
  const centerX = col * CELL + CELL / 2
  const centerY = row * CELL + CELL / 2
  const pulse = 8 + Math.sin(timestamp / 220) * 4

  ctx.save()
  ctx.globalAlpha = 0.28
  ctx.shadowColor = glowColor
  ctx.shadowBlur = pulse + 6
  ctx.fillStyle = glowColor
  ctx.beginPath()
  ctx.arc(centerX, centerY, SPRITE_SIZE / 2 + pulse / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.scale((facingLeft ? -1 : 1) * squash.scaleX, squash.scaleY)
  ctx.drawImage(img, -SPRITE_SIZE / 2, -SPRITE_SIZE / 2, SPRITE_SIZE, SPRITE_SIZE)
  ctx.restore()
}