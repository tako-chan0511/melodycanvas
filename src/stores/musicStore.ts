// src/stores/musicStore.ts
import { defineStore } from "pinia";
import { NoteEvent } from "@/types/note";
import { useAudio } from "@/composables/useAudio"; // useAudio composableをインポート

const { playNote, stopNote, initAudioContext } = useAudio(); // useAudioから関数を取得

export const useMusicStore = defineStore("music", {
  state: () => ({
    recordedNotes: [] as NoteEvent[],
    isRecording: false,
    isPlaying: false,
    recordingStartTime: 0,
    nextNoteId: 0, // ユニークID生成用
    currentPlaybackTimeoutIds: [] as number[], // 再生中のsetTimeout IDを管理
  }),
  actions: {
    // 録音の開始
    async startRecording() {
      // ★async を追加！★
      if (this.isRecording || this.isPlaying) return; // 既に録音中や再生中なら何もしない

      // AudioContextの初期化とSynthのセットアップを待つ
      await initAudioContext(); // ★await する！★

      this.recordedNotes = [];
      this.isRecording = true;
      this.recordingStartTime = performance.now();
      this.nextNoteId = 0;
      console.log("録音を開始しました。");
    },
    // ノートの追加（鍵盤が押された時）
    async addNote(midiNote: number, velocity: number) {
      // ★async を追加！★
      if (this.isRecording) {
        const currentTime = performance.now();
        const startTime = currentTime - this.recordingStartTime;
        this.recordedNotes.push({
          id: `note-${this.nextNoteId++}`,
          midiNote,
          velocity,
          startTime,
          duration: 0, // 音が離されるまでdurationは0
        });
      }
      await playNote(midiNote, velocity); // ★await を追加！★
    },

    // 録音の停止
    stopRecording() {
      this.isRecording = false;
      console.log("録音を停止しました。", this.recordedNotes);
    },

    // ノートの追加（鍵盤が押された時）
    addNote(midiNote: number, velocity: number) {
      if (this.isRecording) {
        const currentTime = performance.now();
        const startTime = currentTime - this.recordingStartTime;
        this.recordedNotes.push({
          id: `note-${this.nextNoteId++}`,
          midiNote,
          velocity,
          startTime,
          duration: 0, // 音が離されるまでdurationは0
        });
      }
      playNote(midiNote, velocity); // 音を鳴らす
    },

    // ノートのリリース（鍵盤が離された時）
    releaseNote(midiNote: number) {
      if (this.isRecording) {
        const currentTime = performance.now();
        // 最後に押された、まだdurationが設定されていないノートを見つける
        const lastNoteIndex = this.recordedNotes.findIndex(
          (note) => note.midiNote === midiNote && note.duration === 0
        );
        if (lastNoteIndex !== -1) {
          // durationを更新
          this.recordedNotes[lastNoteIndex].duration =
            currentTime -
            (this.recordedNotes[lastNoteIndex].startTime +
              this.recordingStartTime);
        }
      }
      stopNote(midiNote); // 音を止める
    },

    // 記録されたシーケンスの再生
    playSequence() {
      if (this.recordedNotes.length === 0) {
        console.log("再生するノートがありません。");
        return;
      }
      if (this.isPlaying) {
        console.log("既に再生中です。");
        return;
      }

      this.isPlaying = true;
      this.currentPlaybackTimeoutIds = []; // 既存のタイムアウトIDをクリア

      // 開始時間でソート（念のため）
      const sortedNotes = [...this.recordedNotes].sort(
        (a, b) => a.startTime - b.startTime
      );

      sortedNotes.forEach((note) => {
        // ノートオンイベントのスケジュール
        const noteOnTimeoutId = setTimeout(() => {
          playNote(note.midiNote, note.velocity);
          // ノートオフイベントのスケジュール
          const noteOffTimeoutId = setTimeout(() => {
            stopNote(note.midiNote);
          }, note.duration);
          this.currentPlaybackTimeoutIds.push(noteOffTimeoutId);
        }, note.startTime);
        this.currentPlaybackTimeoutIds.push(noteOnTimeoutId);
      });

      // 全てのノートが鳴り終わる時間を計算して、再生終了を検知
      const lastNoteEndTime = Math.max(
        ...sortedNotes.map((note) => note.startTime + note.duration)
      );
      const endPlaybackTimeoutId = setTimeout(() => {
        this.isPlaying = false;
        this.currentPlaybackTimeoutIds = []; // 全てのタイムアウトが完了
        console.log("再生が終了しました。");
      }, lastNoteEndTime);
      this.currentPlaybackTimeoutIds.push(endPlaybackTimeoutId);
      console.log("再生を開始しました。");
    },

    // 再生の中断
    stopPlayback() {
      this.isPlaying = false;
      this.currentPlaybackTimeoutIds.forEach((id) => clearTimeout(id)); // 全てのスケジュールをクリア
      this.currentPlaybackTimeoutIds = [];
      // 鳴っている音があれば全て止めるロジックも追加（useAudioで管理しているoscillatorsをクリアするなど）
      console.log("再生を停止しました。");
    },

    // 編集機能（例：ノートのdurationを変更する）
    updateNoteDuration(id: string, newDuration: number) {
      const note = this.recordedNotes.find((n) => n.id === id);
      if (note) {
        note.duration = newDuration;
        console.log(`ノート ${id} の長さを ${newDuration}ms に更新しました。`);
      }
    },

    // ノートの削除
    deleteNote(id: string) {
      this.recordedNotes = this.recordedNotes.filter((n) => n.id !== id);
      console.log(`ノート ${id} を削除しました。`);
    },
  },
});
