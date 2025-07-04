<template>
  <div class="sheet-music-display">
    <h2>あなたの演奏</h2>
    <div class="score-container-wrapper">
      <!-- VexFlowが描画するSVG領域 -->
      <div ref="sheetRef" class="score-container"></div>
      <!-- ノートがない場合のメッセージ -->
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

// propsで楽譜データを受け取る
const props = defineProps<{ notes: NoteEvent[] }>()
const notes = computed(() => props.notes || [])

// Piniaストア
const musicStore = useMusicStore()

// 描画コンテナへのref
const sheetRef = ref<HTMLDivElement | null>(null)

// SVG要素とNoteEvent.idのマップ
const noteMap = new Map<SVGGElement, string>()

// クリック時ノート選択トグル
function onClick(e: MouseEvent) {
  const el = (e.target as Element).closest('.vf-stavenote') as SVGGElement | null
  if (el && noteMap.has(el)) {
    const id = noteMap.get(el)!
    musicStore.selectNote(musicStore.selectedNoteId === id ? null : id)
  } else {
    musicStore.selectNote(null)
  }
  renderScore()
}

// リサイズ時再描画
function onResize() {
  renderScore()
}

// ResizeObserver
let resizeObserver: ResizeObserver | null = null

// 楽譜描画関数
async function renderScore() {
  const container = sheetRef.value
  if (!container) return
  // 描画
  drawVexFlowScore(notes.value, container)

  // 次tickでSVG完成後にノート要素をハイライト
  await nextTick()
  noteMap.clear()
  const svg = container.querySelector('svg')
  if (!svg) return
  svg.querySelectorAll<SVGGElement>('.vf-stavenote').forEach((el, idx) => {
    const ne = notes.value[idx]
    if (!ne) return
    noteMap.set(el, ne.id)
    const isSel = musicStore.selectedNoteId === ne.id
    const color = isSel ? 'blue' : 'black'
    el.style.fill = color
    el.style.stroke = color
    const stem = el.querySelector('.vf-stem') as SVGPathElement | null
    if (stem) stem.style.stroke = color
    const flag = el.querySelector('.vf-flag') as SVGPathElement | null
    if (flag) flag.style.fill = color
  })
}

onMounted(async () => {
  // 初回描画（CSS適用後）
  await nextTick()
  renderScore()

  // ResizeObserverで幅変化検知
  if (sheetRef.value) {
    resizeObserver = new ResizeObserver(() => renderScore())
    resizeObserver.observe(sheetRef.value)
    // クリック, ウィンドウリサイズも
    sheetRef.value.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
  }

  // データ変更時にも再描画
  watch(
    () => props.notes.slice(),
    () => renderScore(),
    { deep: true }
  )
})

onBeforeUnmount(() => {
  if (sheetRef.value) {
    sheetRef.value.removeEventListener('click', onClick)
    window.removeEventListener('resize', onResize)
  }
  if (resizeObserver && sheetRef.value) {
    resizeObserver.unobserve(sheetRef.value)
    resizeObserver.disconnect()
  }
  noteMap.clear()
})
</script>

<style scoped>
.sheet-music-display {
  width: 90%;
  max-width: 800px;
  margin: 20px auto;
  padding: 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
h2 {
  text-align: center;
  margin-bottom: 12px;
  color: #333;
}
.score-container-wrapper {
  position: relative;
}
.score-container {
  position: relative;
  width: 100%;
  height: 200px;
  border: 1px dashed #eee;
  overflow-x: auto;
}
.score-container :deep(svg) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.no-notes-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #888;
  font-style: italic;
  pointer-events: none;
}
.score-container :deep(.vf-stavenote) {
  cursor: pointer;
}
</style>
