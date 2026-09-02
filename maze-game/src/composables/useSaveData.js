const SETTINGS_KEY = 'mazeSettings'
const PROGRESS_KEY = 'mazeResults'
const LAST_LEVEL_KEY = 'mazeLastLevel' 
const ENDLESS_BEST_KEY = 'mazeEndlessBest' 

const DEFAULT_SETTINGS = {
    soundEnabled: true,
}

function getSettings(){
    try{
        const raw = localStorage.getItem(SETTINGS_KEY)
        if(raw) return {...DEFAULT_SETTINGS, ...JSON.parse(raw)}

        const legacySound = localStorage.getItem('mazeSoundEnabled')
        if(legacySound !== null){
            const migrated = {...DEFAULT_SETTINGS, soundEnabled: legacySound !== 'false'} // FIXED — was "legacysound" (lowercase s), a ReferenceError
            saveSettings(migrated)
            return migrated
        }
        return {...DEFAULT_SETTINGS}
    }catch{
        return {...DEFAULT_SETTINGS}
    }
}

function saveSettings(settings){
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
const SECRET = 'maze-game-v1' 

function sign(data) {
  const str = JSON.stringify(data) + SECRET
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

function saveLevelProgress(levelIndex, stars, moves, seconds) {
  const progress = getProgress()
  const existing = progress[levelIndex]
  if (!existing || stars > existing.stars) {
    progress[levelIndex] = { stars, moves, seconds }
    const payload = { data: progress, sig: sign(progress) }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload))
  }
}

function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    const { data, sig } = JSON.parse(raw)
    if (sign(data) !== sig) return {} 
    return data
  } catch {
    return {}
  }
}
function getBestLevelReached(){
    const progress = getProgress()
    const indices = Object.keys(progress).map(Number)
    return indices.length ? Math.max(...indices) + 1 : 0
}

// ADDED — tracks the level the player was last on, independent of stars/completion
function saveLastLevel(levelIndex){
    try{
        localStorage.setItem(LAST_LEVEL_KEY, String(levelIndex))
    }catch{
        // ignore — non-fatal if storage is unavailable
    }
}

// ADDED — returns null if no in-progress level exists yet
function getLastLevel(){
    try{
        const raw = localStorage.getItem(LAST_LEVEL_KEY)
        if(raw === null) return null
        const index = Number(raw)
        return Number.isNaN(index) ? null : index
    }catch{
        return null
    }
}

function resetProgress(){
    localStorage.removeItem(PROGRESS_KEY)
}
function getEndlessBest(){
    try{
        const raw = localStorage.getItem(ENDLESS_BEST_KEY)
        return raw ? Number(raw) : 0
    }catch{
        return 0
    }
}

function saveEndlessBest(depth){
    const best = Math.max(getEndlessBest(), depth)
    try{
        localStorage.setItem(ENDLESS_BEST_KEY, String(best))
    }catch{
        
    }
    return best
}
function resetAll(){
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(PROGRESS_KEY)
    localStorage.removeItem(LAST_LEVEL_KEY) 
    localStorage.removeItem(ENDLESS_BEST_KEY) 
    localStorage.removeItem('mazeSoundEnabled')
}

export const useSaveData = () => {
    return {
    getSettings,
    saveSettings,
    getProgress,
    saveLevelProgress,
    getBestLevelReached,
    saveLastLevel,   
    getLastLevel, 
    getEndlessBest,
    saveEndlessBest,
    resetProgress,
    resetAll,
    }
}