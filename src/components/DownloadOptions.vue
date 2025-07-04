<template>
  <div class="download-options">
    <button
      class="json-btn"
      :disabled="!hasNotes"
      @click="downloadJSON"
    >
      JSONダウンロード
    </button>
    <button
      class="midi-btn"
      :disabled="!hasNotes"
      @click="downloadMIDI"
    >
      MIDIダウンロード
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import type { NoteEvent } from '@/types/note'
import { Midi } from '@tonejs/midi'

const store = useMusicStore()

// ノートが 1 件以上あるときだけ有効
const hasNotes = computed(() => store.recordedNotes.length > 0)

/** JSONダウンロード */
function downloadJSON() {
  const data = {
    notes: store.recordedNotes,
    tempo: store.playbackRate,
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a') as HTMLAnchorElement
  a.href = url
  a.download = 'melodycanvas_score.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** MIDIダウンロード */
function downloadMIDI() {
  // 新しい MIDI インスタンスを作成
  const midi = new Midi()

  // テンポをヘッダー側で設定 (120 BPM を基準に、ユーザーの再生速度を反映)
  midi.header.setTempo(120 * store.playbackRate)

  // トラックを追加
  const track = midi.addTrack()

  // 録音されたノートをシーケンスとしてトラックに登録
  store.recordedNotes.forEach((n: NoteEvent) => {
    // midiNote < 0 は休符として無視
    if (n.midiNote < 0) return

    const startSeconds = n.startTime / 1000
    const durSeconds = n.duration / 1000

    track.addNote({
      midi: n.midiNote,
      time: startSeconds,
      duration: durSeconds,
      velocity: n.velocity / 127,
    })
  })

  // バイナリ配列に変換して Blob 化
  const bytes = midi.toArray()     // Uint8Array
  const blob = new Blob([bytes], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)

  // ダウンロード用リンクを作ってクリック
  const a = document.createElement('a') as HTMLAnchorElement
  a.href = url
  a.download = 'melodycanvas_score.mid'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.download-options {
  margin: 20px 0;
  text-align: center;
  display: flex;
  gap: 10px;
  justify-content: center;
}
.download-options button {
  padding: 8px 16px;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  transition: background-color 0.2s;
}
.download-options button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.download-options .json-btn:hover:not(:disabled),
.download-options .midi-btn:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>
