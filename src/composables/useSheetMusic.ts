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

/**
 * NoteEvent を VexFlow の StaveNote に変換
 */
function convertNoteEventToVexFlowNote(noteEvent: NoteEvent): StaveNote {
  const noteName = Tone.Midi(noteEvent.midiNote).toNote()
  const pitch   = noteName.slice(0, -1)
  const octave  = noteName.slice(-1)

  // keys フォーマット: "c/4", "d#/5" など
  const key = `${pitch[0].toLowerCase()}/${octave}`
  const accidentals: string[] = []
  if (pitch.includes('#')) accidentals.push('#')
  if (pitch.includes('b')) accidentals.push('b')

  // duration を決定 (ミリ秒基準)
  const durMs   = noteEvent.duration
  const quarter = 500
  let duration: string
  if (durMs >= quarter * 1.5) duration = 'h'
  else if (durMs >= quarter * 0.7) duration = 'q'
  else if (durMs >= quarter * 0.3) duration = '8'
  else duration = '16'

  const staveNote = new StaveNote({
    keys: [key],
    duration,
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
