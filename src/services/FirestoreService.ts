import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

class FirestoreService {
  async addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium', description?: string, dueDate?: string): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'tasks'), {
      title,
      description: description || '',
      completed: false,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
      priority,
      dueDate: dueDate || ''
    });
    return docRef.id;
  }

  async getTasks(): Promise<Task[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Task));
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  }
}

export default new FirestoreService();