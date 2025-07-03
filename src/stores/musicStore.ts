// src/stores/musicStore.ts
import { defineStore } from 'pinia';
import { NoteEvent } from '@/types/note';
import { useAudio } from '@/composables/useAudio';

const { playNote, stopNote, initAudioContext } = useAudio();

export const useMusicStore = defineStore('music', {
  state: () => ({
    recordedNotes: [] as NoteEvent[],
    isRecording: false,
    isPlaying: false,
    recordingStartTime: 0,
    nextNoteId: 0,
    currentPlaybackTimeoutIds: [] as number[],
  }),
  actions: { // ★actions ブロックはここから始まり、一つだけであるべきです★
    async startRecording() {
      if (this.isRecording || this.isPlaying) return;

      await initAudioContext();

      this.recordedNotes = [];
      this.isRecording = true;
      this.recordingStartTime = performance.now();
      this.nextNoteId = 0;
      console.log('録音を開始しました。');
    },

    stopRecording() {
      this.isRecording = false;
      console.log('録音を停止しました。', this.recordedNotes);
    },

    // ★この addNote の定義が、この actions ブロック内に一つだけであることを確認！★
    async addNote(midiNote: number, velocity: number) {
      if (this.isRecording) {
        const currentTime = performance.now();
        const startTime = currentTime - this.recordingStartTime;
        this.recordedNotes.push({
          id: `note-${this.nextNoteId++}`,
          midiNote,
          velocity,
          startTime,
          duration: 0,
        });
      }
      await playNote(midiNote, velocity);
    },

    releaseNote(midiNote: number) {
      if (this.isRecording) {
        const currentTime = performance.now();
        const lastNoteIndex = this.recordedNotes.findIndex(
          note => note.midiNote === midiNote && note.duration === 0
        );
        if (lastNoteIndex !== -1) {
          this.recordedNotes[lastNoteIndex].duration = currentTime - (this.recordedNotes[lastNoteIndex].startTime + this.recordingStartTime);
        }
      }
      stopNote(midiNote);
    },

    playSequence() {
      if (this.recordedNotes.length === 0) {
        console.log('再生するノートがありません。');
        return;
      }
      if (this.isPlaying) {
        console.log('既に再生中です。');
        return;
      }

      this.isPlaying = true;
      this.currentPlaybackTimeoutIds = [];

      const sortedNotes = [...this.recordedNotes].sort((a, b) => a.startTime - b.startTime);

      sortedNotes.forEach(note => {
        const noteOnTimeoutId = setTimeout(() => {
          playNote(note.midiNote, note.velocity);
          const noteOffTimeoutId = setTimeout(() => {
            stopNote(note.midiNote);
          }, note.duration);
          this.currentPlaybackTimeoutIds.push(noteOffTimeoutId);
        }, note.startTime);
        this.currentPlaybackTimeoutIds.push(noteOnTimeoutId);
      });

      const lastNoteEndTime = Math.max(...sortedNotes.map(note => note.startTime + note.duration));
      const endPlaybackTimeoutId = setTimeout(() => {
        this.isPlaying = false;
        this.currentPlaybackTimeoutIds = [];
        console.log('再生が終了しました。');
      }, lastNoteEndTime);
      this.currentPlaybackTimeoutIds.push(endPlaybackTimeoutId);
      console.log('再生を開始しました。');
    },

    stopPlayback() {
      this.isPlaying = false;
      this.currentPlaybackTimeoutIds.forEach(id => clearTimeout(id));
      this.currentPlaybackTimeoutIds = [];
      console.log('再生を停止しました。');
    },

    updateNoteDuration(id: string, newDuration: number) {
      const note = this.recordedNotes.find(n => n.id === id);
      if (note) {
        note.duration = newDuration;
        console.log(`ノート ${id} の長さを ${newDuration}ms に更新しました。`);
      }
    },

    deleteNote(id: string) {
      this.recordedNotes = this.recordedNotes.filter(n => n.id !== id);
      console.log(`ノート ${id} を削除しました。`);
    }
  }, // ★actions ブロックはここで終わり、この } が一つであることを確認★
});