// src/types/note.ts
export interface NoteEvent {
  id: string; // ユニークなID（編集時に便利）
  midiNote: number; // MIDIノート番号 (例: 中央のCは60)
  velocity: number; // 打鍵の強さ (0-127)
  startTime: number; // 録音開始からの相対時間 (ミリ秒)
  duration: number; // 音の長さ (ミリ秒)
}