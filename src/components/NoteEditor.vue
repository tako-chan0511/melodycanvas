<script setup lang="ts">
import { useMusicStore } from '@/stores/musicStore';
import { NoteEvent } from '@/types/note';
import { computed, ref, watch } from 'vue';
import * as Tone from 'tone';

const musicStore = useMusicStore();

const selectedNote = computed<NoteEvent | undefined>(() => {
  if (musicStore.selectedNoteId) {
    return musicStore.recordedNotes.find(note => note.id === musicStore.selectedNoteId);
  }
  return undefined;
});

const midiNoteInput = ref(0);
const durationInput = ref(0);
const velocityInput = ref(0);
const noteNameDisplay = ref('');

watch(selectedNote, (newNote) => {
  if (newNote) {
    midiNoteInput.value = newNote.midiNote;
    durationInput.value = newNote.duration;
    velocityInput.value = newNote.velocity;
    noteNameDisplay.value = Tone.Midi(newNote.midiNote).toNote();
  } else {
    midiNoteInput.value = 0;
    durationInput.value = 0;
    velocityInput.value = 0;
    noteNameDisplay.value = '';
  }
}, { immediate: true });

const saveChanges = () => {
  if (selectedNote.value) {
    const newMidiNote = Math.max(0, Math.min(127, midiNoteInput.value));
    const newDuration = Math.max(0, durationInput.value);
    const newVelocity = Math.max(0, Math.min(127, velocityInput.value));

    musicStore.updateNote(selectedNote.value.id, {
      midiNote: newMidiNote,
      duration: newDuration,
      velocity: newVelocity,
    });
    musicStore.selectNote(null);
  }
};

const deleteSelectedNote = () => {
  if (selectedNote.value && confirm('このノートを削除しますか？')) {
    musicStore.deleteNote(selectedNote.value.id);
    musicStore.selectNote(null);
  }
};

const cancelEdit = () => {
  musicStore.selectNote(null);
};
</script>

<template>
  <div class="note-editor-container" v-if="selectedNote">
    <h3>音符の編集</h3>
    <p>ID: {{ selectedNote.id }}</p>
    <div class="editor-row">
      <label>音名:</label>
      <span>{{ noteNameDisplay }}</span>
    </div>
    <div class="editor-row">
      <label for="midiNote">MIDIノート:</label>
      <input type="number" id="midiNote" v-model.number="midiNoteInput" min="0" max="127" />
    </div>
    <div class="editor-row">
      <label for="duration">長さ (ms):</label>
      <input type="number" id="duration" v-model.number="durationInput" min="0" />
    </div>
    <div class="editor-row">
      <label for="velocity">強さ (0-127):</label>
      <input type="number" id="velocity" v-model.number="velocityInput" min="0" max="127" />
    </div>

    <div class="editor-actions">
      <button @click="saveChanges" class="save-button">保存</button>
      <button @click="deleteSelectedNote" class="delete-button">削除</button>
      <button @click="cancelEdit" class="cancel-button">キャンセル</button>
    </div>
  </div>
</template>

<style scoped>
.note-editor-container {
  width: 90%;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f0f8ff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: left;
}

h3 {
  text-align: center;
  color: #333;
  margin-bottom: 15px;
}

.editor-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

label {
  font-weight: bold;
  flex-basis: 30%;
}

input[type="number"] {
  flex-basis: 65%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.editor-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  color: white;
  transition: background-color 0.2s;
}

.save-button {
  background-color: #4CAF50;
}
.save-button:hover {
  background-color: #45a049;
}

.delete-button {
  background-color: #f44336;
}
.delete-button:hover {
  background-color: #d32f2f;
}

.cancel-button {
  background-color: #9e9e9e;
}
.cancel-button:hover {
  background-color: #757575;
}
</style>