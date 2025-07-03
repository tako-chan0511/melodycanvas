// src/composables/useAudio.ts
import * as Tone from 'tone';

// ★修正: synth の型を Tone.PolySynth に明示する
let synth: Tone.PolySynth | null = null;
let isAudioContextInitializing = false;

export const initAudioContext = async () => {
  if (Tone.context.state !== 'running' && !isAudioContextInitializing) {
    isAudioContextInitializing = true;
    try {
      await Tone.start();
      console.log("Tone.js AudioContext started!");

      if (!synth) {
          // Tone.PolySynth の初期化はそのまま
          synth = new Tone.PolySynth(Tone.Synth, {
              oscillator: { type: "triangle" },
              envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 }
          }).toDestination();
          console.log("Tone.PolySynth initialized and connected to destination!");
      }
    } catch (e) {
      console.error("Failed to start Tone.js AudioContext:", e);
    } finally {
        isAudioContextInitializing = false;
    }
  } else if (synth && Tone.context.state === 'running') {
      // console.log("AudioContext and Synth already running/initialized.");
  }
};

export const playNote = async (midiNote: number, velocity: number) => {
  if (!synth || Tone.context.state !== 'running') {
    console.log("Attempting to ensure audio context/synth before playing note.");
    await initAudioContext();
    if (!synth || Tone.context.state !== 'running') {
      console.error("Failed to initialize synth or AudioContext. Cannot play note.");
      return;
    }
  }

  const noteName = Tone.Midi(midiNote).toNote();
  synth.triggerAttack(noteName, Tone.now(), velocity / 127);
};

export const stopNote = (midiNote: number) => {
  if (synth) {
    const noteName = Tone.Midi(midiNote).toNote();
    // ★修正: triggerRelease の第二引数 (時間) を削除
    synth.triggerRelease(noteName);
  } else {
    console.warn("stopNote was called, but synth is not initialized.");
  }
};

export const useAudio = () => {
  return {
    initAudioContext,
    playNote,
    stopNote,
  };
};