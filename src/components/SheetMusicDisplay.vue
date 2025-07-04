<template>
  <div class="sheet-music-display">
    <h2>あなたの演奏</h2>
    <div ref="sheetRef" class="score-container">
      <p v-if="!notes.length" class="no-notes-message">
        まだ演奏がありません。鍵盤を弾いてみましょう！
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { drawVexFlowScore } from '@/composables/useSheetMusic'
import { useMusicStore } from '@/stores/musicStore'
import type { NoteEvent } from '@/types/note'

// Props としてノート配列を受け取る
const props = defineProps<{ notes: NoteEvent[] }>()
const notes = computed(() => props.notes || [])

// Pinia ストア (選択ノートID管理用)
const musicStore = useMusicStore()

// 描画先 ref
const sheetRef = ref<HTMLDivElement | null>(null)

// ノート要素⇔ID マッピング
const noteMap = new Map<HTMLElement, string>()

// 描画関数
async function renderScore() {
  const container = sheetRef.value
  if (!container) return
  
  // ① ここで props.notes を確認
  console.log('[SheetMusicDisplay] renderScore 呼び出し、notes:', notes.value)

  // VexFlow で描画 (内部で container.innerHTML をクリア)
  drawVexFlowScore(notes.value, container)

  // 次tick: SVG 完成後にノート要素を取得してハイライト
  await nextTick()
  noteMap.clear()
  const svg = container.querySelector('svg')
  if (!svg) return
  const noteEls = svg.querySelectorAll<SVGGElement>('.vf-stavenote')
  noteEls.forEach((el, idx) => {
    const ne = notes.value[idx]
    if (!ne) return
    noteMap.set(el as HTMLElement, ne.id)
    const selected = musicStore.selectedNoteId === ne.id
    const color = selected ? 'blue' : 'black'
    ;(el as HTMLElement).style.fill = color
    ;(el as HTMLElement).style.stroke = color
    // ステム／フラグも同色
    const stem = el.querySelector('.vf-stem') as SVGPathElement | null
    if (stem) stem.style.stroke = color
    const flag = el.querySelector('.vf-flag') as SVGPathElement | null
    if (flag) flag.style.fill = color
  })
}

// クリックで選択切り替え
function onClick(event: MouseEvent) {
  const el = (event.target as HTMLElement).closest('.vf-stavenote') as HTMLElement | null
  if (el && noteMap.has(el)) {
    const id = noteMap.get(el)!
    musicStore.selectNote(musicStore.selectedNoteId === id ? null : id)
  } else {
    musicStore.selectNote(null)
  }
  renderScore()
}

// リサイズ対応
function onResize() {
  renderScore()
}

// マウント/アンマウント
onMounted(() => {
  renderScore()
  sheetRef.value?.addEventListener('click', onClick)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  sheetRef.value?.removeEventListener('click', onClick)
  window.removeEventListener('resize', onResize)
  noteMap.clear()
})

// props.notes が変わったら再描画
watch(() => props.notes, renderScore, { deep: true })
</script>

<style scoped>
.sheet-music-display {
  width: 90%; max-width: 800px; margin: 20px auto;
  padding: 16px; background: #fff; border: 1px solid #ddd;
  border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
h2 { text-align: center; margin-bottom: 12px; color: #333; }
.score-container {
  position: relative; width: 100%; height: 200px;
  border: 1px dashed #eee; overflow-x: auto;
}
.score-container :deep(svg) {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
}
.no-notes-message {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: #888; font-style: italic; pointer-events: none;
}
.score-container :deep(.vf-stavenote) { cursor: pointer; }
</style>
