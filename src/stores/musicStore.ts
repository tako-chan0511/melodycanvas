// src/stores/musicStore.ts
import { defineStore } from 'pinia';
import { NoteEvent } from '@/types/note';
import { useAudio } from '@/composables/useAudio';

const { playNote, stopNote, initAudioContext } = useAudio();

// LocalStorageのキー名
const LOCAL_STORAGE_KEY = 'melodyCanvasScores';

// 保存される演奏データの型定義
interface SavedScore {
  id: string; // ユニークなID
  name: string; // ユーザーが付ける名前
  timestamp: number; // 保存日時 (ソート用)
  notes: NoteEvent[]; // 演奏データ
}

// アプリケーションの主要な状態を列挙
type AppState = 'idle' | 'initializing_audio' | 'recording' | 'playing' | 'paused_playback';

export const useMusicStore = defineStore('music', {
  state: () => ({
    recordedNotes: [] as NoteEvent[],
    // ★修正: isRecording, isPlaying などのフラグを AppState に集約
    appState: 'idle' as AppState, // 現在の状態
    
    recordingStartTime: 0,
    nextNoteId: 0,
    currentPlaybackTimeoutIds: [] as number[],
    selectedNoteId: null as string | null,
    savedScores: [] as SavedScore[],
    currentLoadedScoreId: null as string | null,
  }),
  getters: {
    isIdle: (state) => state.appState === 'idle',
    isRecording: (state) => state.appState === 'recording',
    isPlaying: (state) => state.appState === 'playing',
    isPlaybackPaused: (state) => state.appState === 'paused_playback',
    isInitializingAudio: (state) => state.appState === 'initializing_audio',
    canStartRecording: (state) => state.appState === 'idle',
    canStopRecording: (state) => state.appState === 'recording',
    canPlay: (state) => (state.appState === 'idle' || state.appState === 'paused_playback') && state.recordedNotes.length > 0,
    canPause: (state) => state.appState === 'playing',
    canStopPlayback: (state) => state.appState === 'playing' || state.appState === 'paused_playback',
  },
  actions: {
    // --- 永続化関連 ---
    loadAllScores() {
      try {
        const storedScores = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedScores) {
          this.savedScores = JSON.parse(storedScores);
          this.savedScores.sort((a, b) => b.timestamp - a.timestamp);
          console.log('Scores loaded from LocalStorage:', this.savedScores.length);
        }
      } catch (e) {
        console.error('Failed to load scores from LocalStorage:', e);
        this.savedScores = [];
      }
    },

    saveCurrentScore(scoreName: string) {
      if (this.recordedNotes.length === 0) {
        alert('保存する演奏がありません。鍵盤を弾いてください。');
        return;
      }
      if (!scoreName.trim()) {
        alert('保存する演奏の名前を入力してください。');
        return;
      }

      const newScore: SavedScore = {
        id: Date.now().toString(),
        name: scoreName.trim(),
        timestamp: Date.now(),
        notes: JSON.parse(JSON.stringify(this.recordedNotes)),
      };

      const existingIndex = this.savedScores.findIndex(s => s.name === newScore.name);
      if (existingIndex !== -1) {
        this.savedScores[existingIndex] = newScore;
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
          alert('現在録音中または再生中です。操作を完了してから読み込んでください。');
          return;
      }
      const scoreToLoad = this.savedScores.find(s => s.id === scoreId);
      if (scoreToLoad) {
        if (this.recordedNotes.length > 0 && !this.currentLoadedScoreId && !confirm('現在の編集は保存されていません。読み込みますか？')) {
          return; // 未保存の変更がある場合は確認
        }
        this.recordedNotes = JSON.parse(JSON.stringify(scoreToLoad.notes));
        this.currentLoadedScoreId = scoreToLoad.id;
        this.selectedNoteId = null;
        this.appState = 'idle'; // 読み込み後はidle状態に
        alert(`演奏「${scoreToLoad.name}」を読み込みました。`);
      } else {
        alert('指定された演奏が見つかりません。');
      }
    },

/**
     * 手動で追加するノート/休符を「選択ノートの次」または「末尾」に挿入する
     * @param event midiNote===-1 の場合は休符扱い
     */
    addManualNoteEvent(event: Omit<NoteEvent, 'id'>) {
      // 1) 新しい一意の ID を作成
      const id = `note-${this.nextNoteId++}`;

      // 2) 挿入位置を決める:
      //    選択中ノートがあれば、そのインデックス+1
      //    なければ末尾
      const idx = this.recordedNotes.findIndex(n => n.id === this.selectedNoteId);
      const insertPos = idx !== -1 ? idx + 1 : this.recordedNotes.length;

      // 3) NoteEvent を配列に splice で挿入
      this.recordedNotes.splice(
        insertPos,
        0,
        { id, ...event }
      );

      // 選択を新しいノートに切り替えて UI に反映
      this.selectedNoteId = id;
    },

    // …残りのアクション…
  



    deleteScore(scoreId: string) {
      if (!confirm('この演奏データを本当に削除しますか？')) {
        return;
      }
      this.savedScores = this.savedScores.filter(s => s.id !== scoreId);
      this.saveScoresToLocalStorage();
      if (this.currentLoadedScoreId === scoreId) {
        this.currentLoadedScoreId = null;
        this.recordedNotes = [];
        this.selectedNoteId = null;
        this.appState = 'idle'; // 削除後はidle状態に
      }
      alert('演奏データを削除しました。');
    },

    saveScoresToLocalStorage() {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.savedScores));
        console.log('Scores saved to LocalStorage.');
      } catch (e) {
        console.error('Failed to save scores to LocalStorage:', e);
        alert('データの保存に失敗しました。ブラウザのストレージが上限に達している可能性があります。');
      }
    },

    // --- 状態遷移と録音/再生ロジック ---
    async startRecording() {
      if (!this.canStartRecording) {
        console.warn('Cannot start recording: App is not idle.');
        return;
      }
      this.appState = 'initializing_audio'; // 初期化中状態に遷移

      try {
        await initAudioContext(); // AudioContextとSynthの初期化を待つ
        console.log("AudioContext initialized, proceeding to recording setup.");

        this.recordedNotes = []; // 新規録音開始時はクリア
        this.currentLoadedScoreId = null;
        this.selectedNoteId = null;
        this.recordingStartTime = performance.now();
        this.nextNoteId = 0;

        this.appState = 'recording'; // 録音状態に遷移
        console.log('録音を開始しました。');
      } catch (error) {
        console.error("Failed to start recording setup:", error);
        alert("録音の準備に失敗しました。ブラウザのコンソールを確認してください。");
        this.appState = 'idle'; // エラー時はアイドル状態に戻す
      }
    },

    stopRecording() {
      if (!this.canStopRecording) {
        console.warn('Cannot stop recording: App is not in recording state.');
        return;
      }
      this.appState = 'idle'; // アイドル状態に遷移
      console.log('録音を停止しました。', this.recordedNotes);
    },

    async addNote(midiNote: number, velocity: number) {
      // 録音中、またはアイドル状態（かつ譜面表示目的で鍵盤が叩かれた場合）に音を出す
      // 録音中でない場合でも音は鳴らすが、データは記録しない
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
      // どの状態でも鍵盤が叩かれたら音は鳴らす
      // ただし、initializing_audio 状態では initAudioContext() が走るので待つ
      if (this.appState === 'initializing_audio') {
          await initAudioContext(); // initAudioContext は冪等なので複数回呼ばれても安全
      }
      await playNote(midiNote, velocity);
    },

    releaseNote(midiNote: number) {
      // 録音中の場合のみ記録
      if (this.isRecording) {
        const currentTime = performance.now();
        const lastNoteIndex = this.recordedNotes.findIndex(
          note => note.midiNote === midiNote && note.duration === 0
        );
        if (lastNoteIndex !== -1) {
          this.recordedNotes[lastNoteIndex].duration = currentTime - (this.recordedNotes[lastNoteIndex].startTime + this.recordingStartTime);
        }
      }
      // どの状態でも鍵盤が離されたら音を止める
      stopNote(midiNote);
    },

    async playSequence() {
      if (!this.canPlay) {
          console.warn('Cannot play sequence: App is not ready for playback or no notes recorded.');
          return;
      }
      if (this.recordedNotes.length === 0) {
          alert('再生するノートがありません。'); // UIから弾かれるはずだが念のため
          return;
      }

      this.appState = 'initializing_audio'; // 再生前も初期化を待つ状態
      try {
          await initAudioContext(); // AudioContextとSynthの初期化を待つ
          console.log("AudioContext initialized for playback.");

          this.appState = 'playing'; // 再生中状態に遷移
          console.log('再生を開始しました。');
          this.currentPlaybackTimeoutIds = []; // 既存のタイムアウトIDをクリア

          const sortedNotes = [...this.recordedNotes].sort((a, b) => a.startTime - b.startTime);

          sortedNotes.forEach(async note => {
              // note.startTime は相対時間なので、setTimeout でスケジュール
              const noteOnTimeoutId = setTimeout(async () => {
                  // 音を鳴らす前にまだアプリが再生状態か確認 (stopPlaybackでキャンセルされる場合)
                  if (this.isPlaying) {
                      await playNote(note.midiNote, note.velocity);
                      const noteOffTimeoutId = setTimeout(() => {
                          if (this.isPlaying) { // まだ再生状態か確認
                             stopNote(note.midiNote);
                          }
                      }, note.duration);
                      this.currentPlaybackTimeoutIds.push(noteOffTimeoutId);
                  }
              }, note.startTime);
              this.currentPlaybackTimeoutIds.push(noteOnTimeoutId);
          });

          // 全てのノートが鳴り終わる時間を計算して、再生終了を検知
          const lastNoteEndTime = Math.max(0, ...sortedNotes.map(note => note.startTime + note.duration)); // ノートがない場合も考慮
          const endPlaybackTimeoutId = setTimeout(() => {
            if (this.isPlaying) { // 途中で停止されていないか確認
                this.appState = 'idle'; // アイドル状態に遷移
                console.log('再生が終了しました。');
            }
            this.currentPlaybackTimeoutIds = [];
          }, lastNoteEndTime + 100); // 最後の音が完全に消えるまで少し待つ
          this.currentPlaybackTimeoutIds.push(endPlaybackTimeoutId);

      } catch (error) {
          console.error("Failed to start playback setup:", error);
          alert("再生の準備に失敗しました。ブラウザのコンソールを確認してください。");
          this.appState = 'idle'; // エラー時はアイドル状態に戻す
      }
    },

    stopPlayback() {
      if (!this.canStopPlayback) {
        console.warn('Cannot stop playback: App is not in playing or paused state.');
        return;
      }
      this.currentPlaybackTimeoutIds.forEach(id => clearTimeout(id)); // 全てのスケジュールをクリア
      this.currentPlaybackTimeoutIds = [];
      // 鳴っている音があれば全て強制停止するロジックをuseAudioに追加することも可能 (例: stopAllNotes)
      this.appState = 'idle'; // アイドル状態に遷移
      console.log('再生を停止しました。');
    },

    // --- 編集関連 ---
    selectNote(noteId: string | null) {
      this.selectedNoteId = noteId;
      console.log('Selected Note ID:', noteId);
    },

    updateNote(noteId: string, updates: Partial<NoteEvent>) {
      const noteIndex = this.recordedNotes.findIndex(n => n.id === noteId);
      if (noteIndex !== -1) {
        this.recordedNotes[noteIndex] = {
          ...this.recordedNotes[noteIndex],
          ...updates,
        };
        console.log(`Note ${noteId} updated:`, this.recordedNotes[noteIndex]);
      }
    },

    deleteNote(id: string) {
      this.recordedNotes = this.recordedNotes.filter(n => n.id !== id);
      console.log(`ノート ${id} を削除しました。`);
    }
  },
});