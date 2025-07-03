<script setup lang="ts">
import { NoteEvent } from '@/types/note'; // NoteEvent型をインポート

// 親コンポーネントからrecordedNotesを受け取る
const props = defineProps<{
  recordedNotes: NoteEvent[];
}>();

// ダウンロード機能はまだ未実装ですが、ここにロジックを追加します
const downloadAudio = () => {
  alert('音声ダウンロード機能はまだ実装されていません！');
  // ここにuseAudioの録音出力ダウンロードロジックを追加
};

const downloadMidi = () => {
  alert('MIDIダウンロード機能はまだ実装されていません！');
  // ここにmidi-writer-jsを使ったMIDIダウンロードロジックを追加
};
</script>

<template>
  <div class="download-options">
    <h3>ダウンロード</h3>
    <button @click="downloadAudio" :disabled="props.recordedNotes.length === 0">音声 (WAV)</button>
    <button @click="downloadMidi" :disabled="props.recordedNotes.length === 0">MIDI (MID)</button>
  </div>
</template>

<style scoped>
.download-options {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 90%;
  max-width: 800px;
}

button {
  padding: 8px 15px;
  background-color: #2196F3; /* Blue */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

button:hover:not(:disabled) {
  background-color: #1976D2;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>