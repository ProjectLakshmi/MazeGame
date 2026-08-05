
const THEMES = [
  {
    name: 'Verdant',
    wallTop: '#1a3d2e',
    wallBottom: '#0c1f17',
    floorTop: '#2d5c45',
    floorBottom: '#234a37',
    accent: '#52e3a4',
    floodFrom: '#0dd3c4',
    floodTo: '#1a7a5e',
  },
  {
    name: 'Ember',
    wallTop: '#3d2a1a',
    wallBottom: '#1f150c',
    floorTop: '#5c3d23',
    floorBottom: '#4a3019',
    accent: '#ff9f4a',
    floodFrom: '#ff5f3a',
    floodTo: '#7a3a1a',
  },
  {
    name: 'Void',
    wallTop: '#241a3d',
    wallBottom: '#120c1f',
    floorTop: '#3a2d5c',
    floorBottom: '#2e234a',
    accent: '#b06fff',
    floodFrom: '#7b2ff7',
    floodTo: '#3a1a7a',
  },
]

export function getThemeForLevel(levelIndex, totalLevels) {
  const perWorld = Math.ceil(totalLevels / THEMES.length)
  const worldIndex = Math.min(THEMES.length - 1, Math.floor(levelIndex / perWorld))
  return THEMES[worldIndex]
}

export function getAllThemes() {
  return THEMES
}