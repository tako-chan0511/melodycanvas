// src/composables/useAudio.ts
import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let isAudioContextInitializing = false;

/**
 * AudioContext をユーザー操作のタイミングで初期化します。
 */
export async function initAudioContext(): Promise<void> {
  if (Tone.context.state !== 'running' && !isAudioContextInitializing) {
    isAudioContextInitializing = true;
    try {
      await Tone.start();
      console.log('[useAudio] AudioContext started');
      // PolySynth が未作成なら初期化
      if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 }
        }).toDestination();
        console.log('[useAudio] PolySynth initialized');
      }
    } catch (e) {
      console.error('[useAudio] Failed to start AudioContext:', e);
    } finally {
      isAudioContextInitializing = false;
    }
  }
}

/**
 * 指定した MIDI ノートを再生します。
 * @param midiNote MIDI のノート番号 (例: 60)
 * @param velocity 0～127 のベロシティ
 */
export async function playNote(
  midiNote: number,
  velocity: number = 127
): Promise<void> {
  // AudioContext または synth が準備できていなければ初期化
  if (Tone.context.state !== 'running' || !synth) {
    await initAudioContext();
    if (!synth || Tone.context.state !== 'running') {
      console.warn('[useAudio] Cannot play note, synth/context not ready');
      return;
    }
  }
  const noteName = Tone.Midi(midiNote).toNote();
  synth.triggerAttack(noteName, Tone.now(), velocity / 127);
}

/**
 * 指定した MIDI ノートの再生を停止します。
 * @param midiNote MIDI のノート番号
 */
export function stopNote(midiNote: number): void {
  if (!synth) {
    console.warn('[useAudio] stopNote called but synth is not initialized');
    return;
  }
  const noteName = Tone.Midi(midiNote).toNote();
  synth.triggerRelease(noteName, Tone.now());
}

/**
 * Composition API 形式で使用するフック
 */
export function useAudio() {
  return {
    initAudioContext,
    playNote,
    stopNote,
  };
}
