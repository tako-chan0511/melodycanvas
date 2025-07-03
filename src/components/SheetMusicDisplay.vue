<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { NoteEvent } from '@/types/note';
import { drawVexFlowScore } from '@/composables/useSheetMusic'; // 譜面描画関数をインポート

const props = defineProps<{
  notes: NoteEvent[]; // 表示する音符データを受け取る
}>();

const sheetMusicContainer = ref<HTMLElement | null>(null);

// propのnotesが変更されたら譜面を再描画
watch(() => props.notes, (newNotes) => {
  if (sheetMusicContainer.value) {
    drawVexFlowScore(newNotes, sheetMusicContainer.value);
  }
}, { deep: true, immediate: true }); // 初期表示と配列の中身変更を監視

// コンポーネントがマウントされた時に初期描画
onMounted(() => {
  if (sheetMusicContainer.value) {
    drawVexFlowScore(props.notes, sheetMusicContainer.value);
  }
  // ウィンドウサイズ変更時に譜面をリサイズするイベントリスナーを追加
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // コンポーネントがアンマウントされるときにイベントリスナーを削除
  window.removeEventListener('resize', handleResize);
});

const handleResize = () => {
  if (sheetMusicContainer.value) {
    drawVexFlowScore(props.notes, sheetMusicContainer.value);
  }
};
</script>

<template>
  <div class="sheet-music-display">
    <h2>あなたの演奏</h2>
    <div ref="sheetMusicContainer" class="score-container">
      <p v-if="notes.length === 0" class="no-notes-message">
        まだ演奏がありません。鍵盤を弾いてみましょう！
      </p>
    </div>
  </div>
</template>

<style scoped>
.sheet-music-display {
  width: 90%;
  max-width: 800px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.score-container {
  min-height: 180px; /* 譜面が表示されない場合でも高さを確保 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-notes-message {
  color: #888;
  font-style: italic;
}
</style>