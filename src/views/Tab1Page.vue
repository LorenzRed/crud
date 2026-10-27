<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tasks</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tasks</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-grid class="page-content">
        <ion-row>
          <ion-col size="12" size-md="5">
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ editingId ? 'Edit task' : 'Add a task' }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item>
                  <ion-input
                    v-model="form.title"
                    label="Title"
                    label-placement="stacked"
                    placeholder="e.g. Buy groceries"
                    :disabled="saving"
                  />
                </ion-item>
                <ion-item>
                  <ion-textarea
                    v-model="form.description"
                    label="Description"
                    label-placement="stacked"
                    placeholder="Add some details"
                    :auto-grow="true"
                    :disabled="saving"
                  />
                </ion-item>

                <ion-text color="danger" v-if="formError">
                  <p class="message">{{ formError }}</p>
                </ion-text>
                <div class="form-actions">
                  <ion-button expand="block" @click="saveTask" :disabled="saving || !form.title.trim()">
                    {{ saving ? 'Saving...' : editingId ? 'Update task' : 'Add task' }}
                  </ion-button>
                  <ion-button
                    v-if="editingId"
                    fill="clear"
                    expand="block"
                    @click="resetForm"
                    :disabled="saving"
                  >
                    Cancel
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="12" size-md="7">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Your tasks</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-text color="danger" v-if="loadError">
                  <p class="message">{{ loadError }}</p>
                </ion-text>
                <ion-spinner v-if="loading" />
                <ion-list v-else-if="tasks.length">
                  <ion-item v-for="task in tasks" :key="task.id">
                    <ion-label>
                      <h2>{{ task.title }}</h2>
                      <p v-if="task.description">{{ task.description }}</p>
                    </ion-label>
                    <ion-button fill="clear" slot="end" @click="startEditing(task)" aria-label="Edit task">
                      Edit
                    </ion-button>
                    <ion-button
                      fill="clear"
                      color="danger"
                      slot="end"
                      @click="deleteTask(task.id)"
                      aria-label="Delete task"
                    >
                      Delete
                    </ion-button>
                  </ion-item>
                </ion-list>
                <ion-text color="medium" v-else>
                  <p>No tasks yet. Add your first task above.</p>
                </ion-text>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  onIonViewDidEnter,
} from '@ionic/vue';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { reactive, ref } from 'vue';
import { db, firebaseConfigError } from '@/firebase';

interface Task {
  id: string;
  title: string;
  description: string;
}

const tasks = ref<Task[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadError = ref(firebaseConfigError);
const formError = ref('');
const editingId = ref<string | null>(null);
const form = reactive({ title: '', description: '' });
const tasksCollection = db ? collection(db, 'tasks') : null;

const loadTasks = async () => {
  if (!tasksCollection) return;

  loading.value = true;
  loadError.value = '';
  try {
    const snapshot = await getDocs(tasksCollection);
    tasks.value = snapshot.docs
      .map((task) => {
        const data = task.data();
        return {
          id: task.id,
          title: typeof data.title === 'string' ? data.title : '',
          description: typeof data.description === 'string' ? data.description : '',
        };
      })
      .filter((task) => task.title)
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load tasks from Firebase.';
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.title = '';
  form.description = '';
  editingId.value = null;
  formError.value = '';
};

const saveTask = async () => {
  if (!tasksCollection || !form.title.trim()) return;

  saving.value = true;
  formError.value = '';
  const taskData = {
    title: form.title.trim(),
    description: form.description.trim(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingId.value) {
      await updateDoc(doc(tasksCollection, editingId.value), taskData);
    } else {
      await addDoc(tasksCollection, { ...taskData, createdAt: serverTimestamp() });
    }
    resetForm();
    await loadTasks();
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Unable to save the task.';
  } finally {
    saving.value = false;
  }
};

const startEditing = (task: Task) => {
  editingId.value = task.id;
  form.title = task.title;
  form.description = task.description;
  formError.value = '';
};

const deleteTask = async (id: string) => {
  if (!tasksCollection || !window.confirm('Delete this task?')) return;

  loadError.value = '';
  try {
    await deleteDoc(doc(tasksCollection, id));
    tasks.value = tasks.value.filter((task) => task.id !== id);
    if (editingId.value === id) resetForm();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to delete the task.';
  }
};

onIonViewDidEnter(loadTasks);
</script>

<style scoped>
.page-content {
  max-width: 1100px;
  margin: 0 auto;
}

.message {
  margin: 12px 0;
}

.form-actions {
  margin-top: 20px;
}

ion-item + ion-item {
  margin-top: 8px;
}
</style>
