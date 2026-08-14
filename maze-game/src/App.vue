<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import HomeScreen from '@/components/HomeScreen.vue'
import LevelScreen from '@/components/LevelScreen.vue'
import GameScreen from '@/components/GameScreen.vue'
import SettingsScreen from './components/SettingsScreen.vue'

const screenStack = ref(['home'])
const selectedLevel = ref(0)

const currentScreen = computed(() => screenStack.value[screenStack.value.length - 1])

function goTo(screen) {
  screenStack.value.push(screen)
  history.pushState({ screenIndex: screenStack.value.length - 1 }, '')
}


function goBack() {
  if (screenStack.value.length > 1) {
    history.back() 
  }
}

function handlePopState(event) {
  const targetIndex = event.state?.screenIndex ?? 0
  if (targetIndex < screenStack.value.length - 1) {
    screenStack.value = screenStack.value.slice(0, targetIndex + 1)
  }
}

// function startLevel(index) {
//   selectedLevel.value = index
//   goTo('game')
// }
// function continueLevel(index){
//   selectedLevel.value = index
//   goTo('levelSelect')
//   goTo('game')
// }

const gameMode = ref('story')  

function startLevel(index) {
  gameMode.value = 'story'    
  selectedLevel.value = index
  goTo('game')
}
function continueLevel(index){
  gameMode.value = 'story'   
  selectedLevel.value = index
  goTo('levelSelect')
  goTo('game')
}
function startEndless() {    
  gameMode.value = 'endless'
  goTo('game')
}
onMounted(() => {
 
  history.replaceState({ screenIndex: 0 }, '')
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <HomeScreen v-if="currentScreen === 'home'" @start="goTo('levelSelect')" @settings="goTo('settings')" @continue="continueLevel" @endless ="startEndless"/>
  <LevelScreen
    v-else-if="currentScreen === 'levelSelect'"
    @selectLevel="startLevel"
    @back="goBack"
  />
  <SettingsScreen v-else-if ="currentScreen === 'settings' " @back="goBack" />
  <GameScreen
    v-else
    :startLevel="selectedLevel"
    :mode="gameMode"
    @backToLevelSelect="goBack"
  />
</template>