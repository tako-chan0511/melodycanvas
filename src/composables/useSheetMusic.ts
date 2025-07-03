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
 * VexFlow v5.0.0対応
 */
function convertNoteEventToVexFlowNote(noteEvent: NoteEvent): StaveNote {
    const noteName = Tone.Midi(noteEvent.midiNote).toNote();
    let vexFlowKey = `${noteName.charAt(0).toLowerCase()}/${noteName.charAt(noteName.length - 1)}`;

    let processedVexFlowKey = vexFlowKey;
    let accidentals: string[] = [];

    if (noteName.includes('#')) {
        processedVexFlowKey = `${noteName.charAt(0).toLowerCase()}/` + noteName.slice(1).replace('#', '');
        accidentals.push("#");
    } else if (noteName.includes('b')) {
        processedVexFlowKey = `${noteName.charAt(0).toLowerCase()}/` + noteName.slice(1).replace('b', '');
        accidentals.push("b");
    }

    const quarterNoteDurationMs = 500;
    let durationType: 'w' | 'h' | 'q' | '8' | '16' | '32' | '64' | '128';

    if (noteEvent.duration >= quarterNoteDurationMs * 3.5) {
        durationType = 'w';
    } else if (noteEvent.duration >= quarterNoteDurationMs * 1.5) {
        durationType = 'h';
    } else if (noteEvent.duration >= quarterNoteDurationMs * 0.75) {
        durationType = 'q';
    } else if (noteEvent.duration >= quarterNoteDurationMs * 0.375) {
        durationType = '8';
    } else {
        durationType = '16';
    }

    const staveNote = new StaveNote({
        keys: [processedVexFlowKey],
        duration: durationType,
        stemDirection: (parseInt(noteName.charAt(noteName.length - 1)) >= 5) ? Stem.DOWN : Stem.UP,
    });

    accidentals.forEach(acc => {
        staveNote.addModifier(new Accidental(acc));
    });

    return staveNote;
}

/**
 * VexFlowを使用して譜面を描画する関数
 * VexFlow v5.0.0対応
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

    // ★★★ここが最終的なVexFlow v5でのVoiceとノートの扱い★★★
    // VexFlow v5で最も直接的な方法は、Formatterに直接ノートの配列を渡し、
    // VoiceをFormatterが作成するようにする方法です。
    // Voiceを明示的に作成しなくても、Formatterはノートを処理できます。
    // ただし、Voiceを明示的に扱う場合は、以下のようにします。
    const voice = new Voice({ numBeats: 4, beatValue: 4 }); // オプションのみ
    // voice.addStaveNotes(vfNotes); // 型定義やバージョンで問題があるため使用しない

    // Formatterにノート配列を直接渡し、voiceを紐付ける
    // この方法は、VexFlow v5で推奨されるパターンの一つです。
    // フォーマッターはノートを Voice に自動的に割り当てます。
    try {
        // v5のFormatterは、ノートの配列とVoiceの配列を引数に取ることが可能
        // Voiceにノートを追加するメソッドが使えない場合、Formatterに任せる
        Formatter.FormatAndDraw(context, stave, vfNotes, {
            auto_beam: false, // 連桁の自動化 (今は無効)
            // tickContext: voice.getTickContext(), // Voiceを明示的に紐付ける場合
            // add_rest_at_end: true,
        });

        // もし上記の Formatter.FormatAndDraw でエラーが出る場合、
        // 以前の Formatter().joinVoices().format() に戻して、
        // Voice にはノートを「与えない」か、ダミーで動作させる
        // new Formatter().joinVoices([voice]).format([voice], container.offsetWidth - 30);
    } catch (e) {
        console.error("VexFlow formatting error:", e);
        container.innerHTML = `<p style="color: red;">譜面の描画に失敗しました。<br>エラー: ${e.message || e.toString()}</p>`;
        return;
    }

    // voice.draw(context, stave); // Formatter.FormatAndDraw を使う場合は不要になる可能性あり
};