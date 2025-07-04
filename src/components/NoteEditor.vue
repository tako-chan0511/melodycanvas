<template>
  <div class="note-editor">
    <h3>ノート編集・追加</h3>
    <!-- 編集セクション -->
    <div v-if="selectedNote">
      <div class="field">
        <label for="pitch-select">音程 (Note):</label>
        <select id="pitch-select" v-model="editNoteName" :disabled="isEditRest">
          <option v-for="name in noteOptions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="field">
        <label for="duration-select">長さ (Duration):</label>
        <select id="duration-select" v-model="editDurationType">
          <option value="w">全音符</option>
          <option value="h">二分音符</option>
          <option value="q">四分音符</option>
          <option value="8">八分音符</option>
          <option value="16">十六分音符</option>
          <option value="wr">全休符</option>
          <option value="hr">二分休符</option>
          <option value="qr">四分休符</option>
          <option value="8r">八分休符</option>
          <option value="16r">十六分休符</option>
        </select>
      </div>
      <div class="actions">
        <button class="update" @click="applyEdit">更新</button>
        <button class="delete" @click="deleteNote">削除</button>
      </div>
    </div>
    <p v-else class="no-selection">
      譜面上の音符をクリックして選択してください。
    </p>

    <!-- 追加セクション -->
    <div class="add-section">
      <h4>ノートを追加</h4>
      <div class="field">
        <label for="add-pitch-select">音程:</label>
        <select id="add-pitch-select" v-model="newNoteName" :disabled="isAddRest">
          <option v-for="name in noteOptions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="field">
        <label for="add-duration-select">長さ:</label>
        <select id="add-duration-select" v-model="newDurationType">
          <option value="w">全音符</option>
          <option value="h">二分音符</option>
          <option value="q">四分音符</option>
          <option value="8">八分音符</option>
          <option value="16">十六分音符</option>
          <option value="wr">全休符</option>
          <option value="hr">二分休符</option>
          <option value="qr">四分休符</option>
          <option value="8r">八分休符</option>
          <option value="16r">十六分休符</option>
        </select>
      </div>
      <div class="field">
        <label for="add-velocity">強さ:</label>
        <input id="add-velocity" type="number" v-model.number="newVelocity" min="0" max="127" />
      </div>
      <button class="add" @click="addNote">追加</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import * as Tone from 'tone'
import type { NoteEvent } from '@/types/note'

const store = useMusicStore()

// --- 編集用 ---
const selectedNote = computed<NoteEvent | undefined>(() =>
  store.recordedNotes.find(n => n.id === store.selectedNoteId)
)
const editNoteName = ref<string>('')
const editDurationType = ref<'w'|'h'|'q'|'8'|'16'|'wr'|'hr'|'qr'|'8r'|'16r'>('q')
const isEditRest = computed(() => editDurationType.value.endsWith('r'))

watch(selectedNote, note => {
  if (!note) return
  if (note.isRest) {
    editNoteName.value = ''
    const d = note.duration; const q = 500
    if (d >= q*3) editDurationType.value = 'wr'
    else if (d >= q*1.5) editDurationType.value = 'hr'
    else if (d >= q*0.7) editDurationType.value = 'qr'
    else if (d >= q*0.3) editDurationType.value = '8r'
    else editDurationType.value = '16r'
  } else {
    editNoteName.value = Tone.Midi(note.midiNote).toNote()
    const d = note.duration; const q = 500
    if (d >= q*1.5) editDurationType.value = 'h'
    else if (d >= q*0.7) editDurationType.value = 'q'
    else if (d >= q*0.3) editDurationType.value = '8'
    else editDurationType.value = '16'
  }
}, { immediate: true })

// --- 追加用 ---
const newNoteName = ref<string>('C4')
const newDurationType = ref<'w'|'h'|'q'|'8'|'16'|'wr'|'hr'|'qr'|'8r'|'16r'>('q')
const newVelocity = ref<number>(100)
const isAddRest = computed(() => newDurationType.value.endsWith('r'))

// 音名選択肢
const noteOptions = computed<string[]>(() => {
  const arr: string[] = []
  for (let m = 48; m <= 84; m++) arr.push(Tone.Midi(m).toNote())
  return arr
})

function applyEdit() {
  if (!selectedNote.value) return
  const rest = editDurationType.value.endsWith('r')
  const midi = rest ? -1 : Tone.Midi(editNoteName.value).toMidi()
  const q = 500
  const base = editDurationType.value.replace('r','')
  let dur = base === 'w' ? q*4
    : base === 'h' ? q*2
    : base === 'q' ? q
    : base === '8' ? q/2
    : q/4
  store.updateNote(selectedNote.value.id, { midiNote: midi, duration: dur, isRest: rest })
}

function deleteNote() {
  if (!selectedNote.value) return
  store.deleteNote(selectedNote.value.id)
}

function addNote() {
  // 新規ノート／休符を選択中ノートの次に挿入する
  const rest = newDurationType.value.endsWith('r')
  const midi = rest ? -1 : Tone.Midi(newNoteName.value).toMidi()
  const q = 500
  const base = newDurationType.value.replace('r','')
  let dur = base === 'w' ? q * 4
    : base === 'h' ? q * 2
    : base === 'q' ? q
    : base === '8' ? q / 2
    : q / 4

  // 挿入位置の計算: 選択ノートがあればそのインデックス+1、なければ末尾
  const idx = store.recordedNotes.findIndex(n => n.id === store.selectedNoteId)
  // startTime: 選択ノートの startTime+duration か 全ノートの最後
  const start = (idx !== -1)
    ? store.recordedNotes[idx].startTime + store.recordedNotes[idx].duration
    : (store.recordedNotes.length > 0
       ? Math.max(...store.recordedNotes.map(n => n.startTime + n.duration))
       : 0)

  // Store の追加メソッドを呼び出し
  store.addManualNoteEvent({ midiNote: midi, velocity: rest ? 0 : newVelocity.value, startTime: start, duration: dur, isRest: rest })
}
</script>

<style scoped>
.note-editor { width: 90%; max-width: 800px; margin:0 auto 20px; padding:16px; background:#fafafa; border:1px solid #ddd; border-radius:8px; }
.note-editor h3 { margin-bottom:12px; color:#333; }
.field { display:flex; align-items:center; margin-bottom:8px; }
.field label { width:100px; font-weight:bold; }
.field select, .field input { flex:1; padding:4px 8px; border:1px solid #ccc; border-radius:4px; }
.field select:disabled { background:#eee; }
.actions { margin-top:12px; }
.actions button { padding:6px 12px; margin-right:8px; border:none; border-radius:4px; cursor:pointer; }
.actions .update { background:#007bff; color:#fff; }
.actions .delete { background:#dc3545; color:#fff; }
.add-section .add { background:#28a745; color:#fff; padding:6px 12px; border:none; border-radius:4px; cursor:pointer; }
.no-selection { color:#888; font-style:italic; }
</style>
