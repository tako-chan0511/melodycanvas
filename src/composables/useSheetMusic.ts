// src/composables/useSheetMusic.ts
import { Renderer, Stave, Formatter, Voice, StaveNote, Accidental, Stem } from 'vexflow'
import type { NoteEvent } from '@/types/note'
import * as Tone from 'tone'

/**
 * NoteEvent を VexFlow の StaveNote に変換
 */
function convertNoteEventToVexFlowNote(noteEvent: NoteEvent): StaveNote {
  const noteName = Tone.Midi(noteEvent.midiNote).toNote()
  const pitch = noteName.slice(0, -1)
  const octave = noteName.slice(-1)
  let key = `${pitch.toLowerCase()}/${octave}`
  const accidentals: string[] = []

  if (pitch.includes('#')) {
    accidentals.push('#')
    key = `${pitch[0].toLowerCase()}/${octave}`
  } else if (pitch.includes('b')) {
    accidentals.push('b')
    key = `${pitch[0].toLowerCase()}/${octave}`
  }

  // duration を決定
  const dur = noteEvent.duration
  const quarterMs = 500
  let duration: string
  if (dur >= quarterMs * 1.5) duration = 'h'
  else if (dur >= quarterMs * 0.7) duration = 'q'
  else if (dur >= quarterMs * 0.3) duration = '8'
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
 * VexFlow で五線譜を描画
 */
export function drawVexFlowScore(notes: NoteEvent[], containerEl: HTMLElement): void {
  console.log('[drawVexFlowScore] NoteEvent count:', notes.length, notes)
  // 既存描画クリア
  containerEl.innerHTML = ''

  const width = containerEl.clientWidth
  const height = 200
  const renderer = new Renderer(containerEl, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  // 五線譜を描画
  const stave = new Stave(10, 0, width - 20)
  stave.addClef('treble').addTimeSignature('4/4').setContext(context).draw()

  if (!notes.length) {
    console.log('[drawVexFlowScore] no notes to render')
    return
  }

  // NoteEvent -> StaveNote
  const vfNotes = notes.map(convertNoteEventToVexFlowNote)
  console.log('[drawVexFlowScore] vfNotes count:', vfNotes.length, vfNotes)

  // static FormatAndDraw を優先
  try {
    Formatter.FormatAndDraw(context, stave, vfNotes, {
      auto_beam: false,
      align_rests: true,
    })
  } catch (err) {
    console.warn('[drawVexFlowScore] FormatAndDraw failed, fallback manual voice draw:', err)
    const voice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(vfNotes)
    new Formatter().joinVoices([voice]).format([voice], width - 50)
    voice.draw(context, stave)
  }
}
