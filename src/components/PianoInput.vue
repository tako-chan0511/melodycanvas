<template>
  <div>
    <h2>ソフト鍵盤</h2>
    <VirtualPiano @note-on="onNoteOn" @note-off="onNoteOff" />
    <h2>物理 MIDI</h2>
    <PianoInput @note-on="onNoteOn" @note-off="onNoteOff" />
  </div>
</template>

<script setup lang="ts">
import VirtualPiano from '@/components/VirtualPiano.vue'
import PianoInput     from '@/components/PianoInput.vue'

function onNoteOn({ note, velocity }: { note: number; velocity?: number }) {
  console.log('Note On:', note, velocity)
  // 譜面化ロジックへ渡す
}

function onNoteOff({ note }: { note: number }) {
  console.log('Note Off:', note)
}
</script>
