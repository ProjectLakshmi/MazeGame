const THEMES = [
  {
    name: 'Verdant',
    worldTitle: 'The Verdant Depths', // ADDED
    story: 'An ancient grove has swallowed these halls. Something patrols the undergrowth, and the roots below are rising fast.', // ADDED
    wallTop: '#1a3d2e',
    wallBottom: '#0c1f17',
    floorTop: '#2d5c45',
    floorBottom: '#234a37',
    accent: '#52e3a4',
    floodFrom: '#0dd3c4',
    floodTo: '#1a7a5e',
    particleType: 'fireflies', // ADDED
    particleSpeed: 0.015,      // ADDED
    particleDensity: 14,    
    wallTexture: 'vines',
    wallRadius: 10,
    bgPattern: 'moss'
  },
  {
    name: 'Ember',
    worldTitle: 'The Ember Wastes', // ADDED
    story: 'The stone here still remembers fire. Every corridor grows hotter, and the guardian ahead was forged to hunt in the dark.', // ADDED
    wallTop: '#3d2a1a',
    wallBottom: '#1f150c',
    floorTop: '#5c3d23',
    floorBottom: '#4a3019',
    accent: '#ff9f4a',
    floodFrom: '#ff5f3a',
    floodTo: '#7a3a1a',
    particleType: 'embers', // ADDED
    particleSpeed: 0.03,    // ADDED
    particleDensity: 20,
    wallTexture: 'cracks',
    wallRadius: 4,
    bgPattern: 'embercore'    // ADDED
  },
  {
    name: 'Void',
    worldTitle: 'The Hollow Void', // ADDED
    story: 'Beyond here, the maze stops obeying reason. The walls drift. The dark is patient, and it is close.', // ADDED
    wallTop: '#241a3d',
    wallBottom: '#120c1f',
    floorTop: '#3a2d5c',
    floorBottom: '#2e234a',
    accent: '#b06fff',
    floodFrom: '#7b2ff7',
    floodTo: '#3a1a7a',
    particleType: 'motes', // ADDED
    particleSpeed: 0.01,   // ADDED
    particleDensity: 24, 
    wallTexture: 'facets',
    wallRadius: 0,
    bgPattern: 'starfield'   
  },
]
const LEVELS_PER_WORLD = 3

export function getThemeForLevel(levelIndex, totalLevels) {
  const worldIndex = Math.min(THEMES.length - 1, Math.floor(levelIndex / LEVELS_PER_WORLD))
  return THEMES[worldIndex]
}

export function getAllThemes() {
  return THEMES
}

// ADDED — returns intro info only when levelIndex is the FIRST level of a new world, else null
export function getWorldIntroForLevel(levelIndex) {
  const isFirstLevelOfWorld = levelIndex % LEVELS_PER_WORLD === 0
  if (!isFirstLevelOfWorld) return null

  const theme = getThemeForLevel(levelIndex)
  return { worldTitle: theme.worldTitle, story: theme.story }
}