<script setup>
import { ref } from 'vue'
import HomeScreen from '@/components/HomeScreen.vue'
import GameScreen from '@/components/GameScreen.vue'

const currentScreen = ref('home') // 'home' | 'game'
</script>

<template>
  <HomeScreen v-if="currentScreen === 'home'" @start="currentScreen = 'game'" />
  <GameScreen v-else />
</template>