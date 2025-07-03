<script setup lang="ts">
import PianoKeyboard from '@/components/PianoKeyboard.vue';
import SheetMusicDisplay from '@/components/SheetMusicDisplay.vue';
import RecordControls from '@/components/RecordControls.vue';
import DownloadOptions from '@/components/DownloadOptions.vue';
import { useMusicStore } from '@/stores/musicStore';
import { onMounted } from 'vue';
import * as Tone from 'tone'; // Tone.jsをインポート

const musicStore = useMusicStore();

// ★ここでの Tone.start() の呼び出しは削除またはコメントアウトしても良いです★
// AudioContextの開始は、storeのstartRecordingアクションでユーザー操作によってトリガーされるようになりました。
// もし、鍵盤をクリックするだけで録音開始ボタンを押さなくても音を鳴らしたい場合は、
// 鍵盤をクリックした際の最初のハンドラー (handleNoteOn) の中で Tone.start() を呼び出すのが適切です。
onMounted(() => {
  // if (Tone.context.state !== 'running') {
  //   Tone.start().then(() => {
  //     console.log("Tone.js AudioContext started from HomePage onMounted!");
  //   }).catch(e => {
  //     console.error("Failed to start Tone.js AudioContext from HomePage:", e);
  //     // alert("オーディオの初期化に失敗しました。ブラウザのコンソールを確認してください。");
  //   });
  // }
});
</script>

<template>
  <h1>Melody Canvas</h1>
  <p>ピアノを演奏して、楽譜を作成・編集・ダウンロードしよう！</p>

  <RecordControls />

  <PianoKeyboard />

  <SheetMusicDisplay :notes="musicStore.recordedNotes" />

  <DownloadOptions :recordedNotes="musicStore.recordedNotes" />
</template>

<style scoped>
/* HomePage固有のスタイル */
h1 {
  color: #34495e;
}
</style>