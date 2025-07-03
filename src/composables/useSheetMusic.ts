// src/composables/useSheetMusic.ts
// VexFlow v5.0.0 に対応したインポートと使用方法
// 参考: https://www.vexflow.com/docs/
import {
  // 基本的なレンダリング要素
  Renderer, Stave, StaveNote, Formatter, Voice,
  // 臨時記号
  Accidental,
  // 音符の方向 (stemDirection に使う定数)
  Stem,
  // ビーム（連桁）
  Beam,
  // その他の必要なユーティリティ
//   Flow, // VexFlowオブジェクト自体へのアクセス
} from 'vexflow';

import { NoteEvent } from '@/types/note';
import * as Tone from 'tone';

/**
 * NoteEventからVexFlowのStaveNoteに変換するヘルパー
 * VexFlow v5.0.0対応
 */
function convertNoteEventToVexFlowNote(noteEvent: NoteEvent): StaveNote {
    const noteName = Tone.Midi(noteEvent.midiNote).toNote(); // 例: "C4", "D#3"
    const vexFlowKey = `${noteName.charAt(0).toLowerCase()}/${noteName.charAt(1)}`; // 例: "c/4", "d/3"

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

    // durationの計算 (これは簡易的なロジックを維持)
    const defaultBeatDurationMs = 500; // 仮に四分音符が500msとする (BPM120の場合)
    let durationType: 'w' | 'h' | 'q' | '8' | '16' | '32' | '64' | '128';

    if (noteEvent.duration >= defaultBeatDurationMs * 1.8) {
        durationType = 'w'; // 全音符
    } else if (noteEvent.duration >= defaultBeatDurationMs * 0.9) {
        durationType = 'h'; // 2分音符
    } else if (noteEvent.duration >= defaultBeatDurationMs * 0.45) {
        durationType = 'q'; // 4分音符
    } else if (noteEvent.duration >= defaultBeatDurationMs * 0.22) {
        durationType = '8'; // 8分音符
    } else {
        durationType = '16'; // 16分音符
    }

    const staveNote = new StaveNote({
        keys: [processedVexFlowKey],
        duration: durationType,
        // v5 では stemDirection (キャメルケース)
        // Stem.UP (上向き), Stem.DOWN (下向き) 定数を使用
        stemDirection: (parseInt(noteName.charAt(1)) >= 5) ? Stem.DOWN : Stem.UP,
    });

    // 臨時記号の追加
    accidentals.forEach(acc => {
        staveNote.addModifier(new Accidental(acc));
    });

    return staveNote;
}


/**
 * VexFlowを使用して譜面を描画する関数
 * @param notes 描画するNoteEventの配列
 * @param container 譜面を描画するDOM要素 (型を HTMLDivElement に修正)
 */
export const drawVexFlowScore = (notes: NoteEvent[], container: HTMLDivElement) => { // ★ここを修正します★
    container.innerHTML = '';

    // VexFlowのレンダラーを作成
    // container の型が HTMLDivElement になったため、エラーが解消されるはず
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

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addNotes(vfNotes);

    try {
        new Formatter().joinVoices([voice]).format([voice], container.offsetWidth - 30);
    } catch (e) {
        console.error("VexFlow formatting error:", e);
        container.innerHTML = `<p style="color: red;">譜面の描画に失敗しました。<br>エラー: ${e.message || e.toString()}</p>`;
        return;
    }

    voice.draw(context, stave);

    // 連符を描画 (Beamsがある場合) - v5 で Beam のAPIも変更されている可能性あり
    // const beams = Beam.generateBeams(vfNotes, { stem_direction: Stem.UP }); // v5: Stem.UP/DOWN 定数を使う
    // beams.forEach(b => {
    //   b.setContext(context).draw();
    // });
};