
export function encodeLevel(level) {
  const height = level.maze.length
  const width = level.maze[0].length

  const bitCount = width * height
  const byteCount = Math.ceil(bitCount / 8)
  const bytes = new Uint8Array(6 + byteCount)

  bytes[0] = width
  bytes[1] = height
  bytes[2] = level.start.row
  bytes[3] = level.start.col
  bytes[4] = level.exit.row
  bytes[5] = level.exit.col

  let bitIndex = 0
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (level.maze[r][c] === 1) {
        bytes[6 + (bitIndex >> 3)] |= 1 << (bitIndex % 8)
      }
      bitIndex++
    }
  }

  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)

  // Make URL/share-safe (no +, /, or padding =)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeLevel(code) {
  let b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='

  let binary
  try {
    binary = atob(b64)
  } catch {
    throw new Error('Invalid level code')
  }

  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  if (bytes.length < 6) throw new Error('Invalid level code')

  const width = bytes[0]
  const height = bytes[1]
  const start = { row: bytes[2], col: bytes[3] }
  const exit = { row: bytes[4], col: bytes[5] }

  const expectedBytes = 6 + Math.ceil((width * height) / 8)
  if (bytes.length < expectedBytes || width < 3 || height < 3) {
    throw new Error('Invalid level code')
  }

  const maze = []
  let bitIndex = 0
  for (let r = 0; r < height; r++) {
    const row = []
    for (let c = 0; c < width; c++) {
      const byte = bytes[6 + (bitIndex >> 3)]
      row.push((byte >> (bitIndex % 8)) & 1)
      bitIndex++
    }
    maze.push(row)
  }

  return { maze, start, exit }
}