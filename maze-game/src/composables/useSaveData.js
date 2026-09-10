import { ref } from 'vue'
import { fetchProgress, submitLevelResult, submitEndlessDepth } from '@/api/gameApi'

// ---------- Settings — stays in localStorage (pure UI preference, not tamperable-in-a-way-that-matters) ----------
const SETTINGS_KEY = 'mazeSettings'

const DEFAULT_SETTINGS = {
    soundEnabled: true,
}

function getSettings(){
    try{
        const raw = localStorage.getItem(SETTINGS_KEY)
        if(raw) return {...DEFAULT_SETTINGS, ...JSON.parse(raw)}

        const legacySound = localStorage.getItem('mazeSoundEnabled')
        if(legacySound !== null){
            const migrated = {...DEFAULT_SETTINGS, soundEnabled: legacySound !== 'false'}
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

// ---------- Progress — now backed by the server, not localStorage ----------

// Shared reactive state — module-level so every component using useSaveData() sees the same data
const progress = ref({})       // { [levelIndex]: { stars, moves, seconds } }
const lastLevel = ref(null)    // null = no in-progress level yet
const endlessBest = ref(0)
const loaded = ref(false)

// Call this once at app startup (e.g. in App.vue's onMounted) before relying on the values above
async function loadProgress(){
    try{
        const data = await fetchProgress()
        progress.value = data.progress || {}
        lastLevel.value = data.lastLevel > 0 ? data.lastLevel : null
        endlessBest.value = data.endlessBest || 0
    }catch(e){
        console.error('Failed to load progress from server', e)
    }finally{
        loaded.value = true
    }
}

function getProgress(){
    return progress.value
}

// NOTE: now async — callers need `await saveLevelProgress(...)`
async function saveLevelProgress(levelIndex, stars, moves, seconds){
    const existing = progress.value[levelIndex]
    if(!existing || stars > existing.stars){
        // optimistic local update so the UI feels instant
        progress.value = { ...progress.value, [levelIndex]: { stars, moves, seconds } }
    }
    lastLevel.value = levelIndex
    try{
        await submitLevelResult(levelIndex, stars, moves, seconds)
    }catch(e){
        console.error('Failed to save level progress', e)
    }
}

function getBestLevelReached(){
    const indices = Object.keys(progress.value).map(Number)
    return indices.length ? Math.max(...indices) + 1 : 0
}

// lastLevel is now saved as part of saveLevelProgress automatically (server sets it alongside the level result) —
// this standalone setter is no longer needed, but kept as a no-op-safe wrapper in case it's called anywhere else
function saveLastLevel(levelIndex){
    lastLevel.value = levelIndex
}

function getLastLevel(){
    return lastLevel.value
}

// NOTE: now async — callers need `await saveEndlessBest(...)`, and it still returns the resolved best score
async function saveEndlessBest(depth){
    const previous = endlessBest.value
    endlessBest.value = Math.max(previous, depth)
    try{
        const { best } = await submitEndlessDepth(depth)
        endlessBest.value = best
        return best
    }catch(e){
        console.error('Failed to save endless best', e)
        endlessBest.value = previous
        return previous
    }
}

function getEndlessBest(){
    return endlessBest.value
}

// Progress reset now has to happen server-side to be meaningful — see note below
function resetProgress(){
    console.warn('resetProgress: local reset only clears cached state, not server data. Add a DELETE endpoint if you need a real reset.')
    progress.value = {}
    lastLevel.value = null
}

function resetAll(){
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem('mazeSoundEnabled')
    resetProgress()
    endlessBest.value = 0
}

export const useSaveData = () => {
    return {
    getSettings,
    saveSettings,
    progress,
    lastLevel,
    endlessBest,
    loaded,
    loadProgress,
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