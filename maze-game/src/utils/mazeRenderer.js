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
      ctx.save()
      ctx.translate(x, y)

      const gradient = ctx.createLinearGradient(0, 0, 0, CELL)
      if (isWall) {
        gradient.addColorStop(0, theme.wallTop)
        gradient.addColorStop(1, theme.wallBottom)
      } else {
        gradient.addColorStop(0, theme.floorTop)
        gradient.addColorStop(1, theme.floorBottom)
      }
      ctx.fillStyle = gradient
       const radius = isWall ? (theme.wallRadius ?? TILE_RADIUS) : TILE_RADIUS
      roundedRect(ctx, 1, 1, CELL - 2, CELL - 2, radius)
      ctx.fill()
      ctx.restore()
    }
  }
}

export function drawWallTexture(ctx, level, CELL, theme, timestamp) {
  const type = theme.wallTexture
  if (!type) return

  for (let row = 0; row < level.maze.length; row++) {
    for (let col = 0; col < level.maze[row].length; col++) {
      if (level.maze[row][col] !== 1) continue
      const x = col * CELL
      const y = row * CELL
      const seed = row * 97 + col * 13

      ctx.save()
      ctx.translate(x, y)

      if (type === 'vines') drawVineTexture(ctx, CELL, seed, theme)
      else if (type === 'cracks') drawCrackTexture(ctx, CELL, seed, theme, timestamp)
      else if (type === 'facets') drawFacetTexture(ctx, CELL, seed, theme)

      ctx.restore()
    }
  }
}

function drawVineTexture(ctx, CELL, seed, theme) {
  const r1 = seededRandom(seed)
  const r2 = seededRandom(seed + 1)
  if (r1 < 0.35) return // not every wall gets a vine — keeps it subtle

  ctx.strokeStyle = hexToRgba(theme.accent, 0.22)
  ctx.lineWidth = 1.5
  const startX = 4 + r2 * (CELL - 8)
  ctx.beginPath()
  ctx.moveTo(startX, 2)
  ctx.bezierCurveTo(
    startX + (r1 - 0.5) * 14, CELL * 0.35,
    startX - (r1 - 0.5) * 14, CELL * 0.65,
    startX + (r2 - 0.5) * 10, CELL - 2
  )
  ctx.stroke()

  ctx.fillStyle = hexToRgba(theme.accent, 0.3)
  ctx.beginPath()
  ctx.arc(startX + (r1 - 0.5) * 10, CELL * 0.5, 1.6, 0, Math.PI * 2)
  ctx.fill()
}

function drawCrackTexture(ctx, CELL, seed, theme, timestamp) {
  const r1 = seededRandom(seed)
  if (r1 < 0.4) return

  const flicker = 0.4 + Math.abs(Math.sin(timestamp / 500 + seed)) * 0.4
  ctx.strokeStyle = hexToRgba(theme.accent, flicker)
  ctx.shadowColor = theme.accent
  ctx.shadowBlur = 4
  ctx.lineWidth = 1

  let cx = 6 + seededRandom(seed + 2) * (CELL - 12)
  let cy = 4
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  for (let i = 0; i < 3; i++) {
    cx += (seededRandom(seed + i * 3) - 0.5) * 10
    cy += (CELL - 8) / 3
    ctx.lineTo(cx, cy)
  }
  ctx.stroke()
}

function drawFacetTexture(ctx, CELL, seed, theme) {
  const r1 = seededRandom(seed)
  ctx.strokeStyle = hexToRgba(theme.accent, 0.15)
  ctx.lineWidth = 1
  ctx.beginPath()
  if (r1 < 0.5) {
    ctx.moveTo(2, 2)
    ctx.lineTo(CELL - 2, CELL - 2)
  } else {
    ctx.moveTo(CELL - 2, 2)
    ctx.lineTo(2, CELL - 2)
  }
  ctx.stroke()
}

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
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


export function drawAmbientParticles(ctx, canvasWidth, canvasHeight, timestamp, theme) {
  const count = theme.particleDensity || 16
  const speed = theme.particleSpeed || 0.02

  ctx.save()
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5 

    const cycleHeight = canvasHeight + 40
    const riseOffset = (timestamp * speed + seed * 3) % cycleHeight
    const y = canvasHeight - riseOffset + 20
    const sway = Math.sin(timestamp / 1400 + seed) * 12
    const x = ((seed * 47) % canvasWidth) + sway

    const flicker = 0.4 + Math.sin(timestamp / 600 + seed) * 0.3
    const alpha = Math.max(0, Math.min(0.7, flicker))

    let size = 1.6
    if (theme.particleType === 'embers') size = 1.5 + Math.sin(seed) * 1.2
    if (theme.particleType === 'motes') size = 1 + Math.sin(seed * 2) * 0.6
    if (theme.particleType === 'fireflies') size = 1.8 + Math.sin(seed * 1.5) * 0.8

    ctx.globalAlpha = alpha
    ctx.fillStyle = theme.accent
    if (theme.particleType === 'fireflies' || theme.particleType === 'embers') {
      ctx.shadowColor = theme.accent
      ctx.shadowBlur = size * 3
    }
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function drawThemeBackground(ctx, canvasWidth, canvasHeight, theme, timestamp) {
  ctx.save()

  if (theme.bgPattern === 'embercore') {
    const glow = ctx.createRadialGradient(
      canvasWidth / 2, canvasHeight, 0,
      canvasWidth / 2, canvasHeight, canvasHeight * 0.9
    )
    glow.addColorStop(0, theme.wallBottom)
    glow.addColorStop(0.6, theme.wallBottom)
    glow.addColorStop(1, '#000000')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.globalAlpha = 0.05
    ctx.strokeStyle = theme.accent
    for (let i = 0; i < 6; i++) {
      const yBase = canvasHeight - (i * canvasHeight) / 6
      ctx.beginPath()
      for (let x = 0; x <= canvasWidth; x += 8) {
        const y = yBase + Math.sin(x / 30 + timestamp / 700 + i) * 6
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  } else if (theme.bgPattern === 'starfield') {
    ctx.fillStyle = theme.wallBottom
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    for (let i = 0; i < 60; i++) {
      const seed = i * 53.7
      const x = seededRandom(seed) * canvasWidth
      const y = seededRandom(seed + 1) * canvasHeight
      ctx.globalAlpha = 0.2 + Math.abs(Math.sin(timestamp / 800 + seed)) * 0.5
      ctx.fillStyle = theme.accent
      ctx.beginPath()
      ctx.arc(x, y, 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    // 'moss' (default)
    ctx.fillStyle = theme.wallBottom
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.globalAlpha = 0.06
    ctx.fillStyle = theme.accent
    for (let i = 0; i < 30; i++) {
      const seed = i * 41.3
      const x = seededRandom(seed) * canvasWidth
      const y = seededRandom(seed + 1) * canvasHeight
      const size = 6 + seededRandom(seed + 2) * 10
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}