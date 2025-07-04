// src/stores/musicStore.ts
import { defineStore } from 'pinia';
import { NoteEvent } from '@/types/note';
import { useAudio } from '@/composables/useAudio';

const { playNote, stopNote, initAudioContext } = useAudio();

// LocalStorageのキー名
const LOCAL_STORAGE_KEY = 'melodyCanvasScores';

// 保存される演奏データの型定義
interface SavedScore {
  id: string;        // ユニークなID
  name: string;      // ユーザーが付ける名前
  timestamp: number; // 保存日時 (ソート用)
  notes: NoteEvent[];// 演奏データ
}

// アプリケーションの主要な状態を列挙
type AppState = 'idle' | 'initializing_audio' | 'recording' | 'playing' | 'paused_playback';

export const useMusicStore = defineStore('music', {
  state: () => ({
    // 録音・編集済みノート
    recordedNotes: [] as NoteEvent[],
    // 現在のアプリ状態
    appState: 'idle' as AppState,
    // 録音開始時刻
    recordingStartTime: 0,
    // 次に割り振るノートIDのカウンター
    nextNoteId: 0,
    // 再生タイムアウトID一覧
    currentPlaybackTimeoutIds: [] as number[],
    // 現在選択中のノートID
    selectedNoteId: null as string | null,
    // ローカルストレージから読み込んだ保存済スコア一覧
    savedScores: [] as SavedScore[],
    // 現在読み込んでいるスコアID
    currentLoadedScoreId: null as string | null,
    // 再生速度 (1.0 = 100%)
    playbackRate: 1.0,
  }),
  getters: {
    isIdle:           state => state.appState === 'idle',
    isRecording:      state => state.appState === 'recording',
    isPlaying:        state => state.appState === 'playing',
    isPlaybackPaused: state => state.appState === 'paused_playback',
    isInitializing:   state => state.appState === 'initializing_audio',
    canStartRecording:  state => state.appState === 'idle',
    canStopRecording:   state => state.appState === 'recording',
    canPlay:            state => (state.appState === 'idle' || state.appState === 'paused_playback') && state.recordedNotes.length > 0,
    canPause:           state => state.appState === 'playing',
    canStopPlayback:    state => state.appState === 'playing' || state.appState === 'paused_playback',
  },
  actions: {
    // --- 永続化関連 ---
    loadAllScores() {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          this.savedScores = JSON.parse(stored);
          this.savedScores.sort((a, b) => b.timestamp - a.timestamp);
          console.log('Scores loaded:', this.savedScores.length);
        }
      } catch (e) {
        console.error('Failed to load scores:', e);
        this.savedScores = [];
      }
    },

    saveCurrentScore(scoreName: string) {
      if (this.recordedNotes.length === 0) {
        alert('保存する演奏がありません。');
        return;
      }
      if (!scoreName.trim()) {
        alert('演奏名を入力してください。');
        return;
      }

      const newScore: SavedScore = {
        id:        Date.now().toString(),
        name:      scoreName.trim(),
        timestamp: Date.now(),
        notes:     JSON.parse(JSON.stringify(this.recordedNotes)),
      };

      const idx = this.savedScores.findIndex(s => s.name === newScore.name);
      if (idx !== -1) {
        this.savedScores[idx] = newScore;
      } else {
        this.savedScores.push(newScore);
      }
      this.savedScores.sort((a, b) => b.timestamp - a.timestamp);
      this.saveScoresToLocalStorage();
      alert(`演奏「${newScore.name}」を保存しました！`);
      this.currentLoadedScoreId = newScore.id;
    },

    loadScore(scoreId: string) {
      if (this.appState !== 'idle' && this.appState !== 'paused_playback') {
        alert('録音中または再生中は読み込めません。');
        return;
      }
      const sc = this.savedScores.find(s => s.id === scoreId);
      if (!sc) {
        alert('演奏データが見つかりません。');
        return;
      }
      if (this.recordedNotes.length > 0 && !this.currentLoadedScoreId) {
        if (!confirm('未保存の変更があります。読み込みますか？')) {
          return;
        }
      }
      this.recordedNotes       = JSON.parse(JSON.stringify(sc.notes));
      this.currentLoadedScoreId = sc.id;
      this.selectedNoteId       = null;
      this.appState             = 'idle';
      alert(`演奏「${sc.name}」を読み込みました。`);
    },

    deleteScore(scoreId: string) {
      if (!confirm('本当に削除しますか？')) return;
      this.savedScores = this.savedScores.filter(s => s.id !== scoreId);
      this.saveScoresToLocalStorage();
      if (this.currentLoadedScoreId === scoreId) {
        this.currentLoadedScoreId = null;
        this.recordedNotes = [];
        this.selectedNoteId = null;
        this.appState = 'idle';
      }
      alert('演奏を削除しました。');
    },

    saveScoresToLocalStorage() {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.savedScores));
        console.log('Scores saved.');
      } catch (e) {
        console.error('Failed to save scores:', e);
        alert('保存に失敗しました。ストレージ容量をご確認ください。');
      }
    },

    /**
     * 手動で追加するノート／休符を、選択ノートの次または末尾に挿入
     * midiNote === -1 の場合は休符扱い
     */
    addManualNoteEvent(event: Omit<NoteEvent, 'id'>) {
      const id = `note-${this.nextNoteId++}`;
      const idx = this.recordedNotes.findIndex(n => n.id === this.selectedNoteId);
      const pos = idx !== -1 ? idx + 1 : this.recordedNotes.length;
      this.recordedNotes.splice(pos, 0, { id, ...event });
      this.selectedNoteId = id;
    },

    // --- 録音・再生ロジック ---
    async startRecording() {
      if (!this.canStartRecording) return;
      this.appState = 'initializing_audio';
      try {
        await initAudioContext();
        this.recordedNotes      = [];
        this.currentLoadedScoreId = null;
        this.selectedNoteId       = null;
        this.recordingStartTime = performance.now();
        this.nextNoteId         = 0;
        this.appState           = 'recording';
        console.log('録音開始');
      } catch (e) {
        console.error('録音準備失敗', e);
        alert('録音の準備に失敗しました。');
        this.appState = 'idle';
      }
    },

    stopRecording() {
      if (!this.canStopRecording) return;
      this.appState = 'idle';
      console.log('録音停止', this.recordedNotes);
    },

    async addNote(midiNote: number, velocity: number) {
      if (this.isRecording) {
        const now = performance.now();
        this.recordedNotes.push({
          id:        `note-${this.nextNoteId++}`,
          midiNote,
          velocity,
          startTime: now - this.recordingStartTime,
          duration:  0,
        });
      }
      if (this.appState === 'initializing_audio') {
        await initAudioContext();
      }
      await playNote(midiNote, velocity);
    },

    releaseNote(midiNote: number) {
      if (this.isRecording) {
        const now = performance.now();
        const i = this.recordedNotes.findIndex(n => n.midiNote === midiNote && n.duration === 0);
        if (i !== -1) {
          const note = this.recordedNotes[i];
          note.duration = now - (note.startTime + this.recordingStartTime);
        }
      }
      stopNote(midiNote);
    },

    async playSequence() {
      if (!this.canPlay) return;
      this.appState = 'initializing_audio';
      try {
        await initAudioContext();
        this.appState = 'playing';
        this.currentPlaybackTimeoutIds = [];

        let cursor = 0;
        for (const note of this.recordedNotes) {
          const delayOn  = cursor / this.playbackRate;
          const delayOff = (cursor + note.duration) / this.playbackRate;

          const onId = setTimeout(() => {
            if (this.isPlaying && note.midiNote > -1) {
              playNote(note.midiNote, note.velocity);
            }
          }, delayOn);
          this.currentPlaybackTimeoutIds.push(onId);

          const offId = setTimeout(() => {
            if (this.isPlaying && note.midiNote > -1) {
              stopNote(note.midiNote);
            }
          }, delayOff);
          this.currentPlaybackTimeoutIds.push(offId);

          cursor += note.duration;
        }

        const endId = setTimeout(() => {
          if (this.isPlaying) {
            this.appState = 'idle';
          }
          this.currentPlaybackTimeoutIds = [];
        }, cursor / this.playbackRate + 100);
        this.currentPlaybackTimeoutIds.push(endId);

      } catch (e) {
        console.error('再生準備失敗', e);
        this.appState = 'idle';
      }
    },

    stopPlayback() {
      if (!this.canStopPlayback) return;
      this.currentPlaybackTimeoutIds.forEach(id => clearTimeout(id));
      this.currentPlaybackTimeoutIds = [];
      this.appState = 'idle';
      console.log('再生停止');
    },

    // --- 編集関連 ---
    selectNote(noteId: string | null) {
      this.selectedNoteId = noteId;
      console.log('Selected:', noteId);
    },

    updateNote(noteId: string, updates: Partial<NoteEvent>) {
      const i = this.recordedNotes.findIndex(n => n.id === noteId);
      if (i !== -1) {
        this.recordedNotes[i] = { ...this.recordedNotes[i], ...updates };
        console.log('Note updated:', this.recordedNotes[i]);
      }
    },

    deleteNote(id: string) {
      this.recordedNotes = this.recordedNotes.filter(n => n.id !== id);
      console.log('Note deleted:', id);
    },
  }
});
