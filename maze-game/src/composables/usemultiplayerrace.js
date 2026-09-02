import { ref } from 'vue'
import * as signalR from '@microsoft/signalr'


const HUB_URL = import.meta.env.VITE_APP_SIGNALR_HUBURL
console.log(import.meta.env.VITE_TEST_VAR)

export function useMultiplayerRace() {
  const connection = ref(null)
  const connectionState = ref('disconnected')
  const roomCode = ref('')
  const players = ref([])
  const isHost = ref(false)
  const myConnectionId = ref('')
  const joinError = ref('')
  const raceState = ref('lobby') 
  const raceSeed = ref(null)
  const raceDims = ref({ roomsWide: 6, roomsHigh: 6 })
  const raceStartUtc = ref(null)
  const rankings = ref([])

  const opponentPositions = ref({}) 

  async function connect() {
    if (connection.value) return
    connectionState.value = 'connecting'

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build()

    conn.on('RoomUpdated', (roomState) => {
      players.value = roomState.players
      isHost.value = roomState.hostConnectionId === myConnectionId.value
      joinError.value = ''
    })

    conn.on('JoinError', (message) => {
      joinError.value = message
    })

    conn.on('RaceStarting', (data) => {
      raceSeed.value = data.seed
      raceDims.value = { roomsWide: data.roomsWide, roomsHigh: data.roomsHigh }
      raceStartUtc.value = new Date(data.raceStartUtc)
      raceState.value = 'countdown'
    })

    conn.on('PlayerMoved', (data) => {
      opponentPositions.value = {
        ...opponentPositions.value,
        [data.connectionId]: { row: data.row, col: data.col },
      }
    })

    conn.on('RaceOver', (data) => {
       console.log('RaceOver payload:', JSON.stringify(data))
      rankings.value = data.rankings
      raceState.value = 'finished'
    })

    await conn.start()
    myConnectionId.value = conn.connectionId
    connection.value = conn
    connectionState.value = 'connected'
  }

  async function createRoom(playerName) {
    await connect()
    roomCode.value = await connection.value.invoke('CreateRoom', playerName)
    isHost.value = true
    raceState.value = 'lobby'
  }

  async function joinRoom(code, playerName) {
    await connect()
    roomCode.value = code.toUpperCase()
    await connection.value.invoke('JoinRoom', roomCode.value, playerName)
  }

  async function toggleReady() {
    await connection.value?.invoke('ToggleReady', roomCode.value)
  }

  async function startRace() {
    await connection.value?.invoke('StartRace', roomCode.value)
  }

  let lastReportAt = 0
  async function reportProgress(row, col) {
    const now = performance.now()
    if (now - lastReportAt < 100) return
    lastReportAt = now
    await connection.value?.invoke('ReportProgress', roomCode.value, row, col)
  }

  async function reportFinish(elapsedMs) {
    raceState.value = 'finished'
    await connection.value?.invoke('ReportFinish', roomCode.value, elapsedMs)
  }

  async function disconnect() {
    await connection.value?.stop()
    connection.value = null
    connectionState.value = 'disconnected'
    roomCode.value = ''
    players.value = []
    raceState.value = 'lobby'
    opponentPositions.value = {}
    rankings.value = []
  }

  return {
    connectionState,
    roomCode,
    players,
    isHost,
    myConnectionId,
    joinError,
    raceState,
    raceSeed,
    raceDims,
    raceStartUtc,
    rankings,
    opponentPositions,
    createRoom,
    joinRoom,
    toggleReady,
    startRace,
    reportProgress,
    reportFinish,
    disconnect,
  }
}