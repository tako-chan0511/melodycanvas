<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useMusicStore } from '@/stores/musicStore';

const musicStore = useMusicStore();
const startMidiNote = 48; // C3
const endMidiNote = 72;   // C5

const whiteKeysMidiNotes = computed<number[]>(() => {
  const arr: number[] = [];
  for (let i = startMidiNote; i <= endMidiNote; i++) {
    if ([0, 2, 4, 5, 7, 9, 11].includes(i % 12)) arr.push(i);
  }
  return arr;
});

const blackKeysMidiNotes = computed<number[]>(() => {
  const arr: number[] = [];
  for (let i = startMidiNote; i <= endMidiNote; i++) {
    if ([1, 3, 6, 8, 10].includes(i % 12)) arr.push(i);
  }
  return arr;
});

const isBlackKey = (midiNote: number) => {
  const noteInOctave = midiNote % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
};

const press = (note: number) => musicStore.addNote(note, 100);
const release = (note: number) => musicStore.releaseNote(note);

const whiteKeyWidth = 50;
const blackKeyWidth = 35; // 黒鍵の幅は35pxで維持（必要なら調整）

// ★重要修正点: getBlackKeyLeftPosition から補正をすべて削除
const getBlackKeyLeftPosition = (blackMidiNote: number) => {
    let baseWhiteKeyMidi = blackMidiNote;
    const noteInOctave = blackMidiNote % 12;

    switch (noteInOctave) {
        case 1: baseWhiteKeyMidi = blackMidiNote - 1; break; // C#の親はC
        case 3: baseWhiteKeyMidi = blackMidiNote - 1; break; // D#の親はD
        case 6: baseWhiteKeyMidi = blackMidiNote - 1; break; // F#の親はF
        case 8: baseWhiteKeyMidi = blackMidiNote - 1; break; // G#の親はG
        case 10: baseWhiteKeyMidi = blackMidiNote - 1; break; // A#の親はA
        default: return 0;
    }

    let whiteKeysCountBeforeBase = 0;
    for (let i = startMidiNote; i < baseWhiteKeyMidi; i++) {
        if (!isBlackKey(i)) {
            whiteKeysCountBeforeBase++;
        }
    }

    const baseWhiteKeyAbsoluteLeft = whiteKeysCountBeforeBase * whiteKeyWidth;

    // ★leftOffset の基本計算のみを残す★
    // これが黒鍵が親の白鍵の右端に半分食い込む位置
    let leftOffset = baseWhiteKeyAbsoluteLeft + whiteKeyWidth - (blackKeyWidth / 2);

    // ★ここにあった switch 文（fineTuneOffset の計算）はすべて削除しました★

    return leftOffset; // 直接値を返す
};

const blackKeyStyle = (blackMidiNote: number) => {
    return {
        left: getBlackKeyLeftPosition(blackMidiNote) + 'px',
        top: '0px'
    };
};

// ... (キーボード入力マッピング、イベントハンドラーは変更なし) ...
// ここから下は変更なしなので省略
</script>

<template>
  <div class="piano-keyboard-container">
    <div
      v-for="midiNote in whiteKeysMidiNotes"
      :key="midiNote"
      class="white-key"
      @mousedown="press(midiNote)"
      @mouseup="release(midiNote)"
      @mouseleave="release(midiNote)"
      @touchstart.prevent="press(midiNote)"
      @touchend.prevent="release(midiNote)"
      @touchcancel.prevent="release(midiNote)"
    ></div>

    <div
      v-for="midiNote in blackKeysMidiNotes"
      :key="midiNote"
      class="black-key"
      :style="blackKeyStyle(midiNote)"
      @mousedown.stop="press(midiNote)"
      @mouseup.stop="release(midiNote)"
      @mouseleave.stop="release(midiNote)"
      @touchstart.prevent.stop="press(midiNote)"
      @touchend.prevent.stop="release(midiNote)"
      @touchcancel.prevent.stop="release(midiNote)"
    ></div>
  </div>
</template>

<style scoped>
.piano-keyboard-container {
  position: relative;
  display: flex;
  height: 200px;
  margin: 20px auto;
  border: 1px solid #ccc;
  background: #f0f0f0;
  overflow: hidden;
  white-space: nowrap;
}

.white-key {
  width: 50px;
  flex-basis: 50px;
  flex-shrink: 0;
  flex-grow: 0;
  height: 100%;
  background: #fff;
  border-right: 1px solid #bbb;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.1s ease;
  user-select: none;
  z-index: 1;
}

.black-key {
  position: absolute;
  width: 35px; /* 黒鍵の幅は35pxで維持（必要なら調整） */
  height: 60%;
  background: #333;
  z-index: 2;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.1s ease;
  user-select: none;
  border: 1px solid #000;
  border-radius: 0 0 3px 3px;
}

/* 押された時のスタイル */
.white-key:active,
.white-key.active {
  background-color: #aaddff;
}
.black-key:active,
.black-key.active {
  background-color: #555;
}
</style>