// src/composables/useSheetMusic.ts
import {
  Renderer, Stave, StaveNote, Formatter, Voice,
  Accidental,
  Stem,
} from 'vexflow';

import { NoteEvent } from '@/types/note';
import * as Tone from 'tone';

/**
 * NoteEventからVexFlowのStaveNoteに変換するヘルパー
 * VexFlow v4.2.0対応
 */
function convertNoteEventToVexFlowNote(noteEvent: NoteEvent): StaveNote {
    const noteName = Tone.Midi(noteEvent.midiNote).toNote();
    let vexFlowKey = `${noteName.charAt(0).toLowerCase()}/${noteName.charAt(noteName.length - 1)}`;

    let processedVFlowKey = vexFlowKey;
    let accidentals: string[] = [];

    if (noteName.includes('#')) {
        processedVFlowKey = `${noteName.charAt(0).toLowerCase()}/` + noteName.slice(1).replace('#', '');
        accidentals.push("#");
    } else if (noteName.includes('b')) {
        processedVFlowKey = `${noteName.charAt(0).toLowerCase()}/` + noteName.slice(1).replace('b', '');
        accidentals.push("b");
    }

    const quarterNoteDurationMs = 500;
    let durationType: 'w' | 'h' | 'q' | '8' | '16' | '32' | '64' | '128';

    if (noteEvent.duration >= quarterNoteDurationMs * 1.5) {
        durationType = 'h';
    } else if (noteEvent.duration >= quarterNoteDurationMs * 0.7) {
        durationType = 'q';
    } else if (noteEvent.duration >= quarterNoteDurationMs * 0.3) {
        durationType = '8';
    } else {
        durationType = '16';
    }

    const staveNote = new StaveNote({
        keys: [processedVFlowKey],
        duration: durationType,
        // ★修正: stemDirection を stem_direction に変更 (VexFlow v4.2.0 API対応)
        stem_direction: (parseInt(noteName.charAt(noteName.length - 1)) >= 5) ? Stem.DOWN : Stem.UP,
    });

    accidentals.forEach(acc => {
        staveNote.addModifier(new Accidental(acc));
    });

    return staveNote;
}

/**
 * VexFlowを使用して譜面を描画する関数
 * VexFlow v4.2.0対応
 * @param notes 描画するNoteEventの配列
 * @param container 譜面を描画するDOM要素 (HTMLDivElement に型を修正)
 */
export const drawVexFlowScore = (notes: NoteEvent[], container: HTMLDivElement) => {
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(container.offsetWidth, 200);
    const context = renderer.getContext();

    const stave = new Stave(10, 0, container.offsetWidth - 20);
    stave.addClef('treble').addTimeSignature('4/4');
    stave.setContext(context).draw();

    if (notes.length === 0) {
        return;
    }

    const vfNotes = notes.map(convertNoteEventToVexFlowNote);

    // Formatter.FormatAndDraw を使用 (VexFlow v4でも存在)
    try {
        Formatter.FormatAndDraw(context, stave, vfNotes, {
            auto_beam: false, // 連桁の自動化 (今は無効)
            // tickContext: voice.getTickContext(), // 必要であればVoiceとの紐付け
            // add_rest_at_end: true,
        });
        console.log("Formatter.FormatAndDraw used for VexFlow rendering.");
    } catch (e) {
        console.error("VexFlow rendering error with Formatter.FormatAndDraw:", e);
        container.innerHTML = `<p style="color: red;">譜面の描画に失敗しました。<br>エラー: ${e.message || e.toString()}</p>`;
        return;
    }

    // Voice は描画に使わないので、voice.draw() も不要
};
