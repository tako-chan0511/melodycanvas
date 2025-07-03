<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { NoteEvent } from '@/types/note';
import { drawVexFlowScore } from '@/composables/useSheetMusic';

const props = defineProps<{
  notes: NoteEvent[];
}>();

const sheetMusicContainer = ref<HTMLElement | null>(null);

watch(() => props.notes, (newNotes) => {
  if (sheetMusicContainer.value) {
    // ★修正: 型アサーションを追加
    drawVexFlowScore(newNotes, sheetMusicContainer.value as HTMLDivElement);
  }
}, { deep: true, immediate: true });

const handleResize = () => {
  if (sheetMusicContainer.value) {
    // ★修正: 型アサーションを追加
    drawVexFlowScore(props.notes, sheetMusicContainer.value as HTMLDivElement);
  }
};

onMounted(() => {
  if (sheetMusicContainer.value) {
    // ★修正: 型アサーションを追加
    drawVexFlowScore(props.notes, sheetMusicContainer.value as HTMLDivElement);
  }
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
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