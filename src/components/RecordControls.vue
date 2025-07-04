<script setup lang="ts">
import { useMusicStore } from "@/stores/musicStore";

const musicStore = useMusicStore();
</script>

<template>
  <div class="record-controls">
    <button
      @click="musicStore.startRecording"
      :disabled="!musicStore.canStartRecording"
    >
      <span v-if="!musicStore.isRecording">録音開始</span>
      <span v-else>録音中...</span>
    </button>
    <button
      @click="musicStore.stopRecording"
      :disabled="!musicStore.canStopRecording"
    >
      録音停止
    </button>
    <button @click="musicStore.playSequence" :disabled="!musicStore.canPlay">
      <span v-if="!musicStore.isPlaying">再生</span>
      <span v-else>再生中...</span>
    </button>
    <button
      @click="musicStore.stopPlayback"
      :disabled="!musicStore.canStopPlayback"
    >
      再生停止
    </button>
    <p v-if="musicStore.isRecording" class="status-message recording">
      録音中...
    </p>
    <p v-if="musicStore.isPlaying" class="status-message playing">再生中...</p>
    <p v-if="musicStore.isInitializing" class="status-message initializing">
      初期化中...
    </p>
    <p
      v-if="
        musicStore.recordedNotes.length > 0 &&
        !musicStore.isRecording &&
        !musicStore.isPlaying &&
        !musicStore.isInitializing
      "
      class="status-message ready"
    >
      ノート数: {{ musicStore.recordedNotes.length }}
    </p>

    <div class="tempo-control">
      <label for="playback-rate"
        >再生速度: {{ (musicStore.playbackRate * 100).toFixed(0) }}%</label
      >
      <input
        id="playback-rate"
        type="range"
        min="0.1"
        max="2.0"
        step="0.1"
        v-model.number="musicStore.playbackRate"
      />
    </div>
  </div>
</template>

<style scoped>
.record-controls {
  display: flex;
  flex-wrap: wrap; /* 要素が多いときに折り返し */
  gap: 10px;
  align-items: center;
}
/* スライダー部分を flex の末尾に寄せたいなら */
.tempo-control {
  margin-left: auto; /* 右寄せ */
  display: flex;
  align-items: center;
  gap: 6px;
}
/* ラベルと input をもう少し詰めたいなら */
.tempo-control label {
  white-space: nowrap;
  font-size: 0.9rem;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  background-color: #4caf50; /* Green */
  color: white;
  transition: background-color 0.3s ease;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:nth-of-type(1) {
  /* 録音開始ボタン */
  background-color: #f44336; /* Red */
}
button:nth-of-type(1):hover:not(:disabled) {
  background-color: #d32f2f;
}

.status-message {
  margin-left: 10px;
  font-weight: bold;
}
.status-message.recording {
  color: #f44336;
}
.status-message.playing {
  color: #2196f3; /* Blue */
}
.status-message.ready {
  color: #4caf50;
}
</style>
