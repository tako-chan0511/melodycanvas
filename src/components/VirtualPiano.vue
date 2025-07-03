<!-- src/components/VirtualPiano.vue -->
<template>
  <div class="virtual-piano">
    <simple-piano-keyboard
      v-model="selectedNotes"
      lowest-note="C3"
      highest-note="C5"
      :width="600"
      :key-width-size="4"
      :key-height-size="12"
      @note-on="onKeyOn"
      @note-off="onKeyOff"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// vue-piano-plugin は main.ts で .use() している前提
// defineEmits で外へ流す
const emit = defineEmits<{
  (e: 'note-on',  payload: { note: number; velocity: number }): void
  (e: 'note-off', payload: { note: number }): void
}>()

const selectedNotes = ref<Array<number | string>>([])
let prevNotes: Array<number | string> = []

// v-model の差分で on/off を検知
watch(selectedNotes, (current) => {
  // NOTE ON
  current.filter(n => !prevNotes.includes(n))
         .forEach(n => emit('note-on', { note: toMidi(n), velocity: 127 }))

  // NOTE OFF
  prevNotes.filter(n => !current.includes(n))
           .forEach(n => emit('note-off', { note: toMidi(n) }))

  prevNotes = [...current]
})

// simple-piano-keyboard からのイベントを受け取るハンドラも用意
function onKeyOn(note: number, velocity: number) {
  emit('note-on', { note, velocity })
}
function onKeyOff(note: number) {
  emit('note-off', { note })
}

// 文字列（"C4"）→MIDI番号に変換
function toMidi(n: number | string) {
  if (typeof n === 'number') return n
  const semitones: Record<string, number> = {
    C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4,
    F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8,
    A:9, 'A#':10, Bb:10, B:11
  }
  const m = (n as string).match(/^([A-G][b#]?)(\d)$/)
  if (!m) return 60
  const [, pitch, oct] = m
  return semitones[pitch] + (parseInt(oct, 10) + 1) * 12
}
</script>

<style scoped>
.virtual-piano { margin: 1rem 0; }
</style>
