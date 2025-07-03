<template>
  <div>
    <h2>ソフト鍵盤</h2>
    <PianoKeyboard
      startOctave="3"
      endOctave="5"
      :showNotes="true"
      @note-on="onNoteOn"
      @note-off="onNoteOff"
    />

    <h2>物理 MIDI</h2>
    <PianoInput
      @note-on="onNoteOn"
      @note-off="onNoteOff"
    />
  </div>
</template>

<script setup lang="ts">
import PianoKeyboard from '@/components/PianoKeyboard.vue'
import PianoInput    from '@/components/PianoInput.vue'

function onNoteOn(note: number) {
  console.log('Note On:', note)
  // 譜面化ロジックへ渡す
}
function onNoteOff(note: number) {
  console.log('Note Off:', note)
}
</script>
