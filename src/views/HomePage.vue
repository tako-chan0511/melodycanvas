<script setup lang="ts">
import PianoKeyboard     from '@/components/PianoKeyboard.vue'
import SheetMusicDisplay from '@/components/SheetMusicDisplay.vue'
import RecordControls    from '@/components/RecordControls.vue'
import DownloadOptions   from '@/components/DownloadOptions.vue'
import NoteEditor        from '@/components/NoteEditor.vue'
import { useMusicStore } from '@/stores/musicStore'
import { onMounted, ref, watch, computed } from 'vue'
import * as Tone         from 'tone'

const musicStore = useMusicStore()
const scoreNameInput = ref('')

// 鍵盤の NoteOn/Off イベントをストアに登録
function onNoteOn({ note, velocity }: { note: number; velocity?: number }) {
  console.log('[HomePage] Note On イベント:', note, 'velocity:', velocity)
  musicStore.addNote(note, velocity ?? 100)
}
function onNoteOff({ note }: { note: number }) {
  console.log('[HomePage] Note Off イベント:', note)
  musicStore.releaseNote(note)
}

onMounted(() => {
  musicStore.loadAllScores()
  // AudioContext をユーザー操作外でも一度起動しておく
  if (Tone.context.state !== 'running') {
    Tone.start()
      .then(() => console.log('Tone.js AudioContext started from HomePage onMounted!'))
      .catch(e => console.error('Failed to start Tone.js AudioContext from HomePage:', e))
  }
})

// 現在開いているスコア名を表示用に整形
const currentScoreName = computed(() => {
  if (musicStore.currentLoadedScoreId) {
    const score = musicStore.savedScores.find(s => s.id === musicStore.currentLoadedScoreId)
    return score ? score.name : 'Untitled'
  }
  return musicStore.recordedNotes.length > 0 ? '現在の演奏 (未保存)' : '新しい演奏'
})

// スコア名が変わったら入力欄に反映
watch(currentScoreName, newName => {
  if (newName && newName !== '現在の演奏 (未保存)' && newName !== '新しい演奏') {
    scoreNameInput.value = newName
  } else {
    scoreNameInput.value = ''
  }
})
</script>

<template>
  <div class="app-container">
    <h1>Melody Canvas</h1>
    <p>ピアノを演奏して、楽譜を作成・編集・ダウンロードしよう！</p>

    <!-- 録音コントロール -->
    <RecordControls />

    <!-- ソフト鍵盤 -->
    <PianoKeyboard @note-on="onNoteOn" @note-off="onNoteOff" />

    <!-- 譜面表示 -->
    <SheetMusicDisplay :notes="musicStore.recordedNotes" />

    <!-- 音符エディタ（必要に応じて） -->
    <NoteEditor />

    <!-- ダウンロードオプション -->
    <DownloadOptions :recordedNotes="musicStore.recordedNotes" />

    <!-- 演奏の管理 -->
    <div class="score-management">
      <h2>演奏の管理</h2>
      <p class="current-score-status">
        現在開いている演奏:
        <span>{{ currentScoreName }}</span>
        <span
          v-if="musicStore.recordedNotes.length > 0 && !musicStore.currentLoadedScoreId"
          class="unsaved-indicator"
        >(未保存)</span>
      </p>

      <div class="save-section">
        <input
          type="text"
          v-model="scoreNameInput"
          placeholder="演奏名を入力して保存..."
          @keyup.enter="musicStore.saveCurrentScore(scoreNameInput)"
        />
        <button
          @click="musicStore.saveCurrentScore(scoreNameInput)"
          :disabled="musicStore.recordedNotes.length === 0"
        >
          保存
        </button>
      </div>

      <div class="saved-scores-list">
        <h3>保存済みの演奏</h3>
        <p v-if="musicStore.savedScores.length === 0" class="no-saved-scores">
          保存された演奏がありません。
        </p>
        <ul>
          <li
            v-for="score in musicStore.savedScores"
            :key="score.id"
            :class="{ 'is-active': score.id === musicStore.currentLoadedScoreId }"
          >
            <span>{{ score.name }}</span>
            <span class="timestamp">
              {{ new Date(score.timestamp).toLocaleString() }}
            </span>
            <div class="actions">
              <button @click="musicStore.loadScore(score.id)" class="load-button">
                開く
              </button>
              <button @click="musicStore.deleteScore(score.id)" class="delete-button">
                削除
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

h1 {
  color: #34495e;
}

.score-management {
  width: 90%;
  max-width: 800px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: left;
}

.score-management h2,
.score-management h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
}

.current-score-status {
  text-align: center;
  font-weight: bold;
  margin-bottom: 20px;
  color: #555;
}
.current-score-status span {
  color: #007bff;
}
.unsaved-indicator {
  color: #ff0000;
  font-size: 0.8em;
  margin-left: 5px;
}

.save-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.save-section input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}
.save-section button {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.save-section button:hover:not(:disabled) {
  background-color: #218838;
}
.save-section button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.saved-scores-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.saved-scores-list li {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  background-color: #fff;
  transition: background-color 0.2s;
}
.saved-scores-list li:last-child {
  border-bottom: none;
}
.saved-scores-list li:hover {
  background-color: #e9e9e9;
}
.saved-scores-list li.is-active {
  background-color: #d1e7ff;
  font-weight: bold;
}
.saved-scores-list li span {
  flex-grow: 1;
}
.saved-scores-list li .timestamp {
  font-size: 0.8em;
  color: #888;
  margin-right: 10px;
}
.saved-scores-list li .actions button {
  padding: 5px 10px;
  font-size: 0.8em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 5px;
}
.saved-scores-list li .actions .load-button {
  background-color: #007bff;
  color: white;
}
.saved-scores-list li .actions .load-button:hover {
  background-color: #0056b3;
}
.saved-scores-list li .actions .delete-button {
  background-color: #dc3545;
  color: white;
}
.saved-scores-list li .actions .delete-button:hover {
  background-color: #c82333;
}
.no-saved-scores {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 15px;
}
</style>
