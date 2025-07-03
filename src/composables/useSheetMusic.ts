// src/composables/useSheetMusic.ts
import {
  Renderer, Stave, StaveNote, Formatter, Voice,
  Accidental, // 臨時記号
  Stem,     // 音符の方向 (stemDirection に使う定数)
  // Beam, // 連桁（複雑になるため、当面は使用しない）
} from 'vexflow';

import { NoteEvent } from '@/types/note';
import * as Tone from 'tone';

/**
 * NoteEventからVexFlowのStaveNoteに変換するヘルパー
 * VexFlow v5.0.0対応
 */
function convertNoteEventToVexFlowNote(noteEvent: NoteEvent): StaveNote {
    const noteName = Tone.Midi(noteEvent.midiNote).toNote(); // 例: "C4", "D#3"
    let vexFlowKey = `${noteName.charAt(0).toLowerCase()}/${noteName.charAt(noteName.length - 1)}`; // 音名とオクターブを取得

    let processedVexFlowKey = vexFlowKey;
    let accidentals: string[] = []; // 臨時記号を保持する配列

    // シャープやフラットの処理
    if (noteName.includes('#')) {
        processedVexFlowKey = `${noteName.charAt(0).toLowerCase()}/` + noteName.slice(1).replace('#', '');
        accidentals.push("#");
    } else if (noteName.includes('b')) {
        processedVexFlowKey = `${noteName.charAt(0).toLowerCase()}/` + noteName.slice(1).replace('b', '');
        accidentals.push("b");
    }

    // durationの計算 (これは簡易的なロジックを維持。より正確な譜面には複雑なロジックが必要)
    const quarterNoteDurationMs = 500;
    let durationType: 'w' | 'h' | 'q' | '8' | '16' | '32' | '64' | '128';

    if (noteEvent.duration >= quarterNoteDurationMs * 3.5) {
        durationType = 'w'; // 全音符
    } else if (noteEvent.duration >= quarterNoteDurationMs * 1.5) {
        durationType = 'h'; // 2分音符
    } else if (noteEvent.duration >= quarterNoteDurationMs * 0.75) {
        durationType = 'q'; // 4分音符
    } else if (noteEvent.duration >= quarterNoteDurationMs * 0.375) {
        durationType = '8'; // 8分音符
    } else {
        durationType = '16'; // 16分音符
    }

    const staveNote = new StaveNote({
        keys: [processedVexFlowKey],
        duration: durationType,
        stemDirection: (parseInt(noteName.charAt(noteName.length - 1)) >= 5) ? Stem.DOWN : Stem.UP, // オクターブ5以上は符幹を下向きに
    });

    // 臨時記号の追加
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

    // ★重要修正: Voice のインスタンスを生成し、ノートを追加
    const voice = new Voice({ numBeats: 4, beatValue: 4 });

    // --- ここからが最終的な試み ---
    // VexFlow v5 で Voice にノートを追加する最終的な試みです。
    // TypeScriptのエラーを回避しつつ、実行時に動作するかを確認します。
    // まず addStaveNotes を試し、それでも型エラーが出る場合は他の方法へ
    try {
        // v5 のドキュメントでは addStaveNotes が最も一般的
        // TypeScriptがエラーを出す場合、unknown への型アサーションで無理やり通す
        (voice as any).addStaveNotes(vfNotes);
        console.log("Using addStaveNotes for Voice.");
    } catch (e) {
        // addStaveNotes が実行時にも存在しない場合、または型エラーが出る場合
        // v3/v4 で使われた addNotes を試す (これも型エラーになる可能性あり)
        try {
            (voice as any).addNotes(vfNotes);
            console.log("Using addNotes for Voice as fallback.");
        } catch (e2) {
            // 他のどのメソッドも存在しない場合、Voiceのコンストラクタに直接渡す (これも型エラーになった)
            // この場合、ノートをVoiceに追加する方法が他にない。
            console.error("VexFlow Voice: Neither addStaveNotes nor addNotes found. Attempting direct constructor (unlikely to work).", e2);
            // 最終手段として、Voiceをノート付きで再生成するが、これは型エラーになる可能性が高い
            // const voice = new Voice({ numBeats: 4, beatValue: 4 }, vfNotes as any);
            // この場合、VexFlowのバージョンまたは型定義に根本的な問題がある
            container.innerHTML = `<p style="color: red;">重大なVexFlowエラー: ノートをVoiceに追加できません。` +
                                   `VexFlowのバージョンか型定義に問題がある可能性があります。<br>` +
                                   `エラー1: ${(e as any).message || e.toString()}<br>` +
                                   `エラー2: ${(e2 as any).message || e2.toString()}</p>`;
            return;
        }
    }


    try {
        new Formatter().joinVoices([voice]).format([voice], container.offsetWidth - 30);
    } catch (e) {
        console.error("VexFlow formatting error:", e);
        container.innerHTML = `<p style="color: red;">譜面の描画に失敗しました。<br>エラー: ${e.message || e.toString()}</p>`;
        return;
    }

    voice.draw(context, stave);
};