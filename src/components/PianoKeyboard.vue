<!-- src/components/PianoKeyboard.vue -->
<template>
  <div class="piano-keyboard-container">
    <!-- 白鍵 -->
    <div
      v-for="midiNote in whiteKeysMidiNotes"
      :key="midiNote"
      class="white-key"
      @mousedown="handlePress(midiNote)"
      @mouseup="handleRelease(midiNote)"
      @mouseleave="handleRelease(midiNote)"
      @touchstart.prevent="handlePress(midiNote)"
      @touchend.prevent="handleRelease(midiNote)"
      @touchcancel.prevent="handleRelease(midiNote)"
    ></div>

    <!-- 黒鍵 -->
    <div
      v-for="midiNote in blackKeysMidiNotes"
      :key="midiNote"
      class="black-key"
      :style="blackKeyStyle(midiNote)"
      @mousedown.stop="handlePress(midiNote)"
      @mouseup.stop="handleRelease(midiNote)"
      @mouseleave.stop="handleRelease(midiNote)"
      @touchstart.prevent.stop="handlePress(midiNote)"
      @touchend.prevent.stop="handleRelease(midiNote)"
      @touchcancel.prevent.stop="handleRelease(midiNote)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import { initAudioContext } from '@/composables/useAudio'

const musicStore = useMusicStore()
const startMidiNote = 48 // C3
const endMidiNote   = 72 // C5

// 白鍵リスト
const whiteKeysMidiNotes = computed<number[]>(() => {
  const arr: number[] = []
  for (let i = startMidiNote; i <= endMidiNote; i++) {
    if ([0, 2, 4, 5, 7, 9, 11].includes(i % 12)) {
      arr.push(i)
    }
  }
  return arr
})

// 黒鍵リスト
const blackKeysMidiNotes = computed<number[]>(() => {
  const arr: number[] = []
  for (let i = startMidiNote; i <= endMidiNote; i++) {
    if ([1, 3, 6, 8, 10].includes(i % 12)) {
      arr.push(i)
    }
  }
  return arr
})

const whiteKeyWidth = 50
const blackKeyWidth = 35

// 黒鍵の absolute left 算出
function blackKeyStyle(blackMidiNote: number) {
  // 親白鍵を探す
  const n = blackMidiNote % 12
  const base = blackMidiNote - 1
  // 白鍵の中で何番目か
  let count = 0
  for (let i = startMidiNote; i < base; i++) {
    if (![1, 3, 6, 8, 10].includes(i % 12)) count++
  }
  let left = count * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2
  // 微調整
  if (n === 1)  left -= 6
  if (n === 3)  left += 4
  if (n === 6)  left -= 6
  if (n === 8)  left += 4
  if (n === 10) left += 4

  return { left: `${left}px`, top: '0px' }
}

// キー操作: 鍵盤を押したとき
async function handlePress(midiNote: number) {
  // Chrome の Autoplay 制限を回避するため、
  // まずユーザー操作で AudioContext を起動
  await initAudioContext()
  musicStore.addNote(midiNote, 100)
}

// 指を離したとき
function handleRelease(midiNote: number) {
  musicStore.releaseNote(midiNote)
}

// キーボード入力マッピング
const keyboardMap: Record<string, number> = {
  a:48, w:49, s:50, e:51, d:52, f:53, t:54, g:55, y:56, h:57, u:58, j:59,
  k:60, o:61, l:62, p:63, ';':64, "'":65, '[':66, ']':67,
  z:60, x:62, c:64, v:65, b:67, n:69, m:71,
  q:72
}

const pressed = new Set<string>()

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat) return
  const note = keyboardMap[e.key]
  if (note !== undefined && !pressed.has(e.key)) {
    handlePress(note)
    pressed.add(e.key)
  }
}

function onKeyUp(e: KeyboardEvent) {
  const note = keyboardMap[e.key]
  if (note !== undefined && pressed.has(e.key)) {
    handleRelease(note)
    pressed.delete(e.key)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup',   onKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup',   onKeyUp)
})
</script>

<style scoped>
.piano-keyboard-container {
  position: relative;
  display: flex;
  height: 200px;
  margin: 20px auto;
  border: 1px solid #ccc;
  background: #f0f0f0;
  overflow: hidden;
  white-space: nowrap;
}

.white-key {
  flex: 0 0 50px;
  background: #fff;
  border-right: 1px solid #bbb;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.1s;
}
.white-key:active {
  background: #aaddff;
}

.black-key {
  position: absolute;
  width: 35px;
  height: 60%;
  background: #333;
  border: 1px solid #000;
  border-radius: 0 0 3px 3px;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.1s;
}
.black-key:active {
  background: #555;
}
</style>
