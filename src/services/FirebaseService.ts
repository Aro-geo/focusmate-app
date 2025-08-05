import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0A6vB81_lMuBnR7mXi6Kb6DO2TS3hGVY",
  authDomain: "focusmate-ai-8cad6.firebaseapp.com",
  projectId: "focusmate-ai-8cad6",
  storageBucket: "focusmate-ai-8cad6.firebasestorage.app",
  messagingSenderId: "704086849869",
  appId: "1:704086849869:web:5374e89bfb21729f8c1f04",
  measurementId: "G-JH4NYF7RNJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class FirebaseService {
  async addTask(title: string, priority: string = 'medium') {
    const docRef = await addDoc(collection(db, 'tasks'), {
      title,
      priority,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 1
    });
    return { id: docRef.id, title, priority, completed: false };
  }

  async getTasks() {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async toggleTask(taskId: string) {
    const taskRef = doc(db, 'tasks', taskId);
    const tasks = await this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      await updateDoc(taskRef, {
        completed: !task.completed,
        updated_at: new Date().toISOString()
      });
      return { ...task, completed: !task.completed };
    }
    throw new Error('Task not found');
  }

  async deleteTask(taskId: string) {
    await deleteDoc(doc(db, 'tasks', taskId));
  }
}

export const firebaseService = new FirebaseService();