import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
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
  
  async getPomodoroSessions(date?: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      const userSessionsCollection = collection(db, 'users', user.uid, 'pomodoroSessions');
      const querySnapshot = await getDocs(userSessionsCollection);
      const sessions = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const sessionDate = data.date || data.createdAt?.toDate()?.toISOString().split('T')[0];
        
        if (!date || sessionDate === date) {
          sessions.push({
            id: doc.id,
            userId: data.userId,
            duration: data.duration || data.durationMinutes || 25,
            completed: data.completed || false,
            date: sessionDate,
            startTime: data.startTime,
            endTime: data.endTime,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
      }
      
      return sessions;
    } catch (e) {
      console.error("Error getting pomodoro sessions: ", SecurityUtils.sanitizeForLog(String(e)));
      return [];
    }
  }

  async savePomodoroSession(sessionData: any) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      const userSessionsCollection = collection(db, 'users', user.uid, 'pomodoroSessions');
      await addDoc(userSessionsCollection, {
        ...sessionData,
        createdAt: new Date()
      });
    } catch (e) {
      console.error("Error saving pomodoro session: ", SecurityUtils.sanitizeForLog(String(e)));
    }
  }

  async saveTip(tip: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    try {
      const userTipsCollection = collection(db, 'users', user.uid, 'savedTips');
      await addDoc(userTipsCollection, {
        tip,
        createdAt: new Date(),
        source: 'ai_coach'
      });
    } catch (e) {
      console.error("Error saving tip: ", SecurityUtils.sanitizeForLog(String(e)));
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

  // Subscription management methods
  async saveUserSubscription(userId: string, subscription: any): Promise<void> {
    try {
      await setDoc(doc(db, 'subscriptions', userId), {
        ...subscription,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving user subscription:', error);
      throw error;
    }
  }

  async getUserSubscription(userId: string): Promise<any | null> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
      return subscriptionDoc.exists() ? subscriptionDoc.data() : null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  async getLastAIRequestDate(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      return userData?.lastAIRequestDate || null;
    } catch (error) {
      console.error('Error getting last AI request date:', error);
      return null;
    }
  }

  async resetDailyAIRequests(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        dailyAIRequests: 0,
        lastAIRequestDate: new Date().toDateString()
      });
    } catch (error) {
      console.error('Error resetting daily AI requests:', error);
    }
  }

  async recordAIRequest(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const dailyRequests = (userData?.dailyAIRequests || 0) + 1;
      
      await updateDoc(userRef, {
        dailyAIRequests: dailyRequests,
        lastAIRequestDate: new Date().toDateString(),
        totalAIRequests: (userData?.totalAIRequests || 0) + 1
      });
    } catch (error) {
      console.error('Error recording AI request:', error);
    }
  }
}

export const firebaseService = new FirebaseService();