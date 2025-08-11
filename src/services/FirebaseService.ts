import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SecurityUtils } from '../utils/security';

export class FirebaseService {
  async addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string) {
    // Validate and sanitize input
    const validation = SecurityUtils.validateTaskInput(title);
    if (!validation.isValid) {
      throw new Error('Invalid task title');
    }
    
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // If no due date provided, default to today
      const today = new Date().toISOString().split('T')[0];
      
      const userTasksCollection = collection(db, 'users', user.uid, 'tasks');
      const docRef = await addDoc(userTasksCollection, {
        title: validation.sanitized,
        priority,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: dueDate || today, // Default to today
        user_id: user.uid
      });
      console.log("Task added with ID: ", SecurityUtils.sanitizeForLog(docRef.id));
      return { 
        id: docRef.id, 
        title: validation.sanitized, 
        priority: priority as 'low' | 'medium' | 'high', 
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: dueDate || today, // Default to today
        user_id: user.uid
      };
    } catch (e) {
      console.error("Error adding task: ", SecurityUtils.sanitizeForLog(String(e)));
      throw e;
    }
  }

  async getTasks() {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      const userTasksCollection = collection(db, 'users', user.uid, 'tasks');
      const querySnapshot = await getDocs(userTasksCollection);
      const tasks: any[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      return tasks;
    } catch (e) {
      console.error("Error getting tasks: ", SecurityUtils.sanitizeForLog(String(e)));
      throw e;
    }
  }

  async toggleTask(taskId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      const tasks = await this.getTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        await updateDoc(taskRef, {
          completed: !task.completed,
          updated_at: new Date().toISOString()
        });
        console.log("Task toggled: ", SecurityUtils.sanitizeForLog(taskId));
        return { ...task, completed: !task.completed };
      }
      throw new Error('Task not found');
    } catch (e) {
      console.error("Error toggling task: ", SecurityUtils.sanitizeForLog(String(e)));
      throw e;
    }
  }

  async deleteTask(taskId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
      console.log("Task deleted: ", SecurityUtils.sanitizeForLog(taskId));
    } catch (e) {
      console.error("Error deleting task: ", SecurityUtils.sanitizeForLog(String(e)));
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