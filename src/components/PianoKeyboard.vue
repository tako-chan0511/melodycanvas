<template>
  <div class="keyboard">
    <!-- 白鍵 (Natural keys) -->
    <div
      v-for="key in whiteKeys"
      :key="key.note"
      :class="['white-key', { pressed: activeNotes.includes(key.note) } ]"
      @mousedown="press(key.note)"
      @mouseup="release(key.note)"
      @mouseleave="release(key.note)"
    >
      <span v-if="showNotes" class="label">{{ key.label }}</span>
    </div>

    <!-- 黒鍵 (Sharp keys) -->
    <div
      v-for="key in blackKeys"
      :key="key.note"
      :class="['black-key', { pressed: activeNotes.includes(key.note) } ]"
      :style="{ left: key.position + 'px' }"
      @mousedown="press(key.note)"
      @mouseup="release(key.note)"
      @mouseleave="release(key.note)"
    >
      <span v-if="showNotes" class="label">{{ key.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// Props: 描画するオクターブ範囲とノートラベル表示
const props = defineProps({
  startOctave: { type: Number, default: 4 },
  endOctave:   { type: Number, default: 5 },
  showNotes:   { type: Boolean, default: false },
});
// note-on/off を上位へ通知
const emit = defineEmits<{
  (e: 'note-on',  note: number): void;
  (e: 'note-off', note: number): void;
}>();

// アクティブなノート一覧
const activeNotes = ref<number[]>([]);

// 白鍵データを生成
interface Key { note: number; label: string; }
const whiteKeys = computed<Key[]>(() => {
  const arr: Key[] = [];
  for (let oct = props.startOctave; oct <= props.endOctave; oct++) {
    for (const step of ['C','D','E','F','G','A','B']) {
      const semitoneMap: Record<string, number> = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
      const midi = (oct + 1) * 12 + semitoneMap[step];
      arr.push({ note: midi, label: `${step}${oct}` });
    }
  }
  return arr;
});

// 黒鍵データを生成
const blackKeys = computed(() => {
  // 白鍵ひとつ分の幅
  const whiteWidth = 40;
  // 黒鍵が乗る位置オフセット (白鍵インデックスに対して調整)
  const offsets: Record<string, number> = { C: 0.75, D: 1.75, F: 3.75, G: 4.75, A: 5.75 };

  return whiteKeys.value
    .filter(k => ['C','D','F','G','A'].includes(k.label[0]))
    .map(k => {
      const step = k.label[0];
      const baseIndex = whiteKeys.value.findIndex(w => w.note === k.note);
      return {
        note: k.note + 1,
        label: `${step}#${k.label.slice(1)}`,
        position: (baseIndex + offsets[step]) * whiteWidth,
      };
    });
});

// 鍵押下
function press(note: number) {
  if (!activeNotes.value.includes(note)) {
    activeNotes.value.push(note);
    emit('note-on', note);
  }
}
// 鍵離放
function release(note: number) {
  const i = activeNotes.value.indexOf(note);
  if (i >= 0) {
    activeNotes.value.splice(i, 1);
    emit('note-off', note);
  }
}
</script>

<style scoped>
.keyboard {
  position: relative;
  user-select: none;
}
.white-key {
  width: 40px;
  height: 150px;
  background: white;
  border: 1px solid #333;
  display: inline-block;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}
.white-key.pressed {
  background: #e0e0e0;
}
.black-key {
  position: absolute;
  width: 30px;
  height: 100px;
  background: black;
  top: 0;
  margin-left: -15px;
  z-index: 2;
}
.black-key.pressed {
  background: #555;
}
.label {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #333;
}
</style>
