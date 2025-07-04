// src/composables/useSheetMusic.ts
import {
  Renderer,
  Stave,
  Formatter,
  Voice,
  StaveNote,
  Accidental,
  Stem,
} from 'vexflow'
import type { NoteEvent } from '@/types/note'
import * as Tone from 'tone'


/** NoteEvent → VexFlow StaveNote 変換 */
function convertNoteEventToVexFlowNote(ne: NoteEvent): StaveNote {
  const q = 500  // 四分音符を 500ms とする基準

  // ★休符の場合★
  if (ne.isRest) {
    // duration(ms) からタイプを決定
    let restType: 'wr'|'hr'|'qr'|'8r'|'16r' = 'qr'
    if (ne.duration >= q * 3)       restType = 'wr'
    else if (ne.duration >= q * 1.5) restType = 'hr'
    else if (ne.duration >= q * 0.7) restType = 'qr'
    else if (ne.duration >= q * 0.3) restType = '8r'
    else                             restType = '16r'

    // keys はダミーで b/4 を使う（VexFlow の推奨）
    return new StaveNote({
      keys: ['b/4'],
      duration: restType,
    })
  }

  // ★通常の音符の場合★
  const noteName = Tone.Midi(ne.midiNote).toNote()      // ex: "C#4"
  const pitch    = noteName.slice(0, -1)                // ex: "C#"
  const octave   = noteName.slice(-1)                   // ex: "4"

  // keys フォーマット "c#/4"
  let key = `${pitch[0].toLowerCase()}/${octave}`
  const accidentals: string[] = []
  if (pitch.includes('#')) accidentals.push('#')
  if (pitch.includes('b')) accidentals.push('b')

  // duration(ms) → VexFlow の文字列
  let durationType: 'w'|'h'|'q'|'8'|'16' = 'q'
  if (ne.duration >= q * 1.5)      durationType = 'h'
  else if (ne.duration >= q * 0.7) durationType = 'q'
  else if (ne.duration >= q * 0.3) durationType = '8'
  else                              durationType = '16'

  const staveNote = new StaveNote({
    keys: [key],
    duration: durationType,
    stem_direction: parseInt(octave, 10) >= 5 ? Stem.DOWN : Stem.UP,
  })
  accidentals.forEach(acc => staveNote.addModifier(new Accidental(acc)))
  return staveNote
}

/**
 * notes を受け取って五線譜を描画
 * @param notes NoteEvent[]
 * @param containerEl HTMLDivElement
 */
export function drawVexFlowScore(
  notes: NoteEvent[],
  containerEl: HTMLDivElement
): void {
  // 既存SVGクリア
  containerEl.innerHTML = ''

  // コンテナ幅取得
  const rect = containerEl.getBoundingClientRect()
  const containerWidth = Math.floor(rect.width)
  const NOTE_SPACING = 60
  const requiredWidth = notes.length * NOTE_SPACING + 40
  const drawWidth = Math.max(containerWidth, requiredWidth, 200)
  const height = 200

  // レンダラー初期化
  const renderer = new Renderer(containerEl, Renderer.Backends.SVG)
  renderer.resize(drawWidth, height)
  const ctx = renderer.getContext()

  // 五線譜描画
  const stave = new Stave(10, 0, drawWidth - 20)
  stave.addClef('treble').addTimeSignature('4/4').setContext(ctx).draw()

  if (!notes.length) {
    return
  }

  // NoteEvent -> StaveNote
  const vfNotes = notes.map(convertNoteEventToVexFlowNote)

  // まずは FormatAndDraw を試す (align_rests で小節を埋める)
  try {
    Formatter.FormatAndDraw(ctx, stave, vfNotes, {
      auto_beam: false,
      align_rests: true,
    })
    return
  } catch (err) {
    console.warn('[drawVexFlowScore] FormatAndDraw failed:', err)
  }

  // フォールバック: 手動レイアウト
  const voice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(vfNotes)
  new Formatter().joinVoices([voice]).format([voice], drawWidth - 20)
  voice.draw(ctx, stave)
}
