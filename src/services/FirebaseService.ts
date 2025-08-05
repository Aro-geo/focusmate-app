import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export class FirebaseService {
  async addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        title,
        priority,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 1
      });
      console.log("Task added with ID: ", docRef.id);
      return { 
        id: docRef.id, 
        title, 
        priority: priority as 'low' | 'medium' | 'high', 
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 1
      };
    } catch (e) {
      console.error("Error adding task: ", e);
      throw e;
    }
  }

  async getTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasks: any[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      return tasks;
    } catch (e) {
      console.error("Error getting tasks: ", e);
      throw e;
    }
  }

  async toggleTask(taskId: string) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const tasks = await this.getTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        await updateDoc(taskRef, {
          completed: !task.completed,
          updated_at: new Date().toISOString()
        });
        console.log("Task toggled: ", taskId);
        return { ...task, completed: !task.completed };
      }
      throw new Error('Task not found');
    } catch (e) {
      console.error("Error toggling task: ", e);
      throw e;
    }
  }

  async deleteTask(taskId: string) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      console.log("Task deleted: ", taskId);
    } catch (e) {
      console.error("Error deleting task: ", e);
      throw e;
    }
  }

  // Example user management functions
  async addUser(name: string, email: string) {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        name: name,
        email: email,
        timestamp: Date.now()
      });
      console.log("User added with ID: ", docRef.id);
      return docRef.id;
    } catch (e) {
      console.error("Error adding user: ", e);
      throw e;
    }
  }

  async getUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (e) {
      console.error("Error getting users: ", e);
      throw e;
    }
  }
}

export const firebaseService = new FirebaseService();