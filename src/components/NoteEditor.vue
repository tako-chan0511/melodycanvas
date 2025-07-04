<template>
  <div class="note-editor">
    <h3>ノート編集</h3>
    <div v-if="selectedNote">
      <!-- 音程編集 -->
      <div class="field">
        <label for="pitch-select">音程 (Note):</label>
        <select
          id="pitch-select"
          v-model="editNoteName"
          :disabled="isRest"
        >
          <option v-for="name in noteOptions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>

      <!-- 長さ／休符編集 -->
      <div class="field">
        <label for="duration-select">長さ (Duration):</label>
        <select id="duration-select" v-model="editDurationType">
          <option value="w">全音符 (Whole)</option>
          <option value="h">二分音符 (Half)</option>
          <option value="q">四分音符 (Quarter)</option>
          <option value="8">八分音符 (Eighth)</option>
          <option value="16">十六分音符 (Sixteenth)</option>
          <option value="wr">全休符 (Whole Rest)</option>
          <option value="hr">二分休符 (Half Rest)</option>
          <option value="qr">四分休符 (Quarter Rest)</option>
          <option value="8r">八分休符 (Eighth Rest)</option>
          <option value="16r">十六分休符 (16th Rest)</option>
        </select>
      </div>

      <!-- 更新／削除 -->
      <div class="actions">
        <button class="update" @click="applyEdit">更新</button>
        <button class="delete" @click="deleteNote">削除</button>
      </div>
    </div>
    <p v-else class="no-selection">
      譜面上の音符をクリックして選択してください。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useMusicStore } from "@/stores/musicStore"
import * as Tone from "tone"
import type { NoteEvent } from "@/types/note"

const store = useMusicStore()

// 選択中のノート
const selectedNote = computed<NoteEvent | undefined>(() => {
  return store.recordedNotes.find((n) => n.id === store.selectedNoteId)
})

// 編集用ローカル state
const editNoteName = ref<string>("")
const editDurationType = ref<"w" | "h" | "q" | "8" | "16" | "wr" | "hr" | "qr" | "8r" | "16r">("q")
const isRest = computed(() => editDurationType.value.endsWith('r'))

// 選択ノートが変わったら form に反映
watch(
  selectedNote,
  (note) => {
    if (!note) return
    // 休符かどうか
    if (note.isRest) {
      // 休符の場合は音程選択無効
      editNoteName.value = ''
      // durationType を復元
      // duration ms から判定（単純化）
      const d = note.duration
      const q = 500
      if (d >= q * 3) editDurationType.value = 'wr'
      else if (d >= q * 1.5) editDurationType.value = 'hr'
      else if (d >= q * 0.7) editDurationType.value = 'qr'
      else if (d >= q * 0.3) editDurationType.value = '8r'
      else editDurationType.value = '16r'
    } else {
      // 音符の場合
      const name = Tone.Midi(note.midiNote).toNote()
      editNoteName.value = name
      // duration をタイプに変換
      const d = note.duration
      const q = 500
      if (d >= q * 1.5) editDurationType.value = "h"
      else if (d >= q * 0.7) editDurationType.value = "q"
      else if (d >= q * 0.3) editDurationType.value = "8"
      else editDurationType.value = "16"
    }
  },
  { immediate: true }
)

// 音名リスト (C3〜C6)
const noteOptions = computed<string[]>(() => {
  const opts: string[] = []
  for (let m = 48; m <= 84; m++) {
    opts.push(Tone.Midi(m).toNote())
  }
  return opts
})

// 更新
function applyEdit() {
  if (!selectedNote.value) return
  // 休符判定
  const rest = editDurationType.value.endsWith('r')
  // midiNote は休符時 -1
  const midi = rest ? -1 : Tone.Midi(editNoteName.value).toMidi()
  // durationType→ms
  const q = 500
  let dur = q
  const baseType = editDurationType.value.replace('r','')
  switch (baseType) {
    case "w": dur = q * 4; break
    case "h": dur = q * 2; break
    case "q": dur = q;     break
    case "8": dur = q / 2; break
    case "16":dur = q / 4; break
  }
  // ストア更新
  store.updateNote(selectedNote.value.id, {
    midiNote: midi,
    duration: dur,
    isRest: rest
  })
}

// 削除
function deleteNote() {
  if (!selectedNote.value) return
  store.deleteNote(selectedNote.value.id)
}
</script>

<style scoped>
.note-editor {
  width: 90%;
  max-width: 800px;
  margin: 0 auto 20px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.note-editor h3 {
  margin-bottom: 12px;
  color: #333;
}
.field {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.field label {
  width: 100px;
  font-weight: bold;
}
.field select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.field select:disabled {
  background: #eee;
}
.actions {
  margin-top: 12px;
}
.actions button {
  padding: 6px 12px;
  margin-right: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.actions .update {
  background: #007bff;
  color: #fff;
}
.actions .delete {
  background: #dc3545;
  color: #fff;
}
.no-selection {
  color: #888;
  font-style: italic;
}
</style>
