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
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from 'vue'
import { drawVexFlowScore } from '@/composables/useSheetMusic'
import { useMusicStore } from '@/stores/musicStore'
import type { NoteEvent } from '@/types/note'

// props で楽譜データを受け取る
const props = defineProps<{ notes: NoteEvent[] }>()
const notes = computed(() => props.notes || [])

// 選択ノート管理のため Pinia ストア
const musicStore = useMusicStore()

// 描画領域 (HTMLDivElement)
const sheetRef = ref<HTMLDivElement | null>(null)

// SVG 上の SVGGElement と NoteEvent.id のマッピング
const noteMap = new Map<SVGGElement, string>()

// 描画関数
async function renderScore() {
  console.log('[SheetMusicDisplay] renderScore start, notes=', props.notes)
  const container = sheetRef.value
  if (!container) return

  // VexFlow で描画 (container.innerHTML は内部でクリアされる)
  drawVexFlowScore(notes.value, container)

  // 次の tick で SVG 完成 → ノート要素を取得してハイライト
  await nextTick()
  noteMap.clear()
  const svg = container.querySelector('svg')
  if (!svg) return
  const noteEls = svg.querySelectorAll<SVGGElement>('.vf-stavenote')
  noteEls.forEach((el, idx) => {
    const ne = notes.value[idx]
    if (!ne) return
    noteMap.set(el, ne.id)
    const isSel = musicStore.selectedNoteId === ne.id
    const color = isSel ? 'blue' : 'black'
    el.style.fill = color
    el.style.stroke = color
    // ステム／フラグも同色
    const stem = el.querySelector('.vf-stem') as SVGPathElement | null
    if (stem) stem.style.stroke = color
    const flag = el.querySelector('.vf-flag') as SVGPathElement | null
    if (flag) flag.style.fill = color
  })
}

// ノートクリックで選択切り替え
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

// リサイズ対応
function onResize() {
  renderScore()
}
// ResizeObserver を破棄するために外部へ保持
let resizeObserver: ResizeObserver | null = null
onMounted(async () => {
  console.log('[SheetMusicDisplay] onMounted')
  // Vue の DOM 更新／CSS 適用が終わった次の tick で一度描画
  await nextTick()
  renderScore()

  // さらに要素サイズが変わったら常に再描画
  if (sheetRef.value) {
    resizeObserver = new ResizeObserver(() => {
      renderScore()
    })
    resizeObserver.observe(sheetRef.value)
  }
})
onBeforeUnmount(() => {
  // 既存処理…
  if (resizeObserver && sheetRef.value) {
    resizeObserver.unobserve(sheetRef.value)
    resizeObserver.disconnect()
  }
})

watch(
  () => props.notes.slice(),  // 配列の変更を深く検知
  () => {
    console.log('[SheetMusicDisplay] notes変更を検知')
    renderScore()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  sheetRef.value?.removeEventListener('click', onClick)
  window.removeEventListener('resize', onResize)
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
