// src/composables/useAudio.ts
import * as Tone from 'tone';

// Tone.Synth インスタンスをモジュールスコープで管理
let synth: Tone.Synth | null = null;
let isAudioContextInitializing = false; // 初期化中フラグ

// AudioContextの初期化とTone.jsの起動
// この関数は非同期なので、呼び出し元では await するか、Promise を処理する必要がある
export const initAudioContext = async () => {
  // AudioContextがまだ動いていない、かつ初期化中でない場合のみ処理
  if (Tone.context.state !== 'running' && !isAudioContextInitializing) {
    isAudioContextInitializing = true;
    try {
      await Tone.start(); // AudioContextを再開または開始
      console.log("Tone.js AudioContext started!");

      // ★AudioContextが開始されたら、ここでsynthも初期化する（一度だけ）★
      if (!synth) { // synthがまだnullの場合のみ初期化
          synth = new Tone.PolySynth(Tone.Synth, { // PolySynth を使うことで、複数の同時発音を適切に管理
              oscillator: { type: "triangle" },
              envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 } // release を少し調整
          }).toDestination();
          console.log("Tone.PolySynth initialized and connected to destination!");
      }
    } catch (e) {
      console.error("Failed to start Tone.js AudioContext:", e);
      // alert("オーディオの初期化に失敗しました。ブラウザのコンソールを確認してください。");
    } finally {
        isAudioContextInitializing = false; // 初期化完了
    }
  } else if (synth) {
      // 既にrunning状態、かつsynthも初期化済みなら何もしない
      // console.log("AudioContext and Synth already running/initialized.");
  }
};

// 音を鳴らす関数
export const playNote = async (midiNote: number, velocity: number) => {
  // synth が初期化されていない、または AudioContext が停止中であれば初期化を試みる
  if (!synth || Tone.context.state !== 'running') {
    console.log("Attempting to ensure audio context/synth before playing note.");
    await initAudioContext(); // 初期化を待つ
    if (!synth || Tone.context.state !== 'running') {
      console.error("Failed to initialize synth or AudioContext. Cannot play note.");
      return; // 初期化に失敗したら音を鳴らさない
    }
  }

  // ★Tone.PolySynth の場合は triggerAttack/triggerRelease に midiNote を直接渡すことが多い
  const noteName = Tone.Midi(midiNote).toNote();
  synth.triggerAttack(noteName, Tone.now(), velocity / 127);
  // console.log(`Play: ${noteName} (MIDI: ${midiNote})`);
};

// 音を停止する関数
export const stopNote = (midiNote: number) => {
  if (synth) { // synth が null でないことを保証
    const noteName = Tone.Midi(midiNote).toNote();
    synth.triggerRelease(noteName, Tone.now());
    // console.log(`Stop: ${noteName} (MIDI: ${midiNote})`);
  } else {
    // 理想的にはここには入らない
    console.warn("stopNote was called, but synth is not initialized.");
  }
};

// useAudio composableを返す関数
export const useAudio = () => {
  return {
    initAudioContext,
    playNote,
    stopNote,
  };
};