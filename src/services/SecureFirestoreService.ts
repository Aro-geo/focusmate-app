import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SecurityUtils } from '../utils/security';

export interface SecureTask {
  id?: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SecureJournalEntry {
  id?: string;
  title: string;
  content: string;
  mood: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class SecureFirestoreService {
  private validateUserId(userId: string): boolean {
    return typeof userId === 'string' && userId.length > 0 && userId.length < 128;
  }

  // Secure task operations with proper validation
  async addTask(title: string, priority: 'low' | 'medium' | 'high', userId: string): Promise<string> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    const validation = SecurityUtils.validateTaskInput(title);
    if (!validation.isValid) {
      throw new Error('Invalid task title');
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      throw new Error('Invalid priority level');
    }

    try {
      const taskData: Omit<SecureTask, 'id'> = {
        title: validation.sanitized,
        priority,
        completed: false,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const userTasksCollection = collection(db, 'users', userId, 'tasks');
      const docRef = await addDoc(userTasksCollection, taskData);
      console.log('Task added successfully:', SecurityUtils.sanitizeForLog(docRef.id));
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to add task');
    }
  }

  async getTasks(userId: string): Promise<SecureTask[]> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      // Use parameterized query to prevent NoSQL injection
      const userTasksCollection = collection(db, 'users', userId, 'tasks');
      const q = query(
        userTasksCollection,
        orderBy('createdAt', 'desc'),
        limit(100) // Limit results for performance
      );

      const querySnapshot = await getDocs(q);
      const tasks: SecureTask[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          title: data.title,
          priority: data.priority,
          completed: data.completed,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to retrieve tasks');
    }
  }

  async updateTask(taskId: string, updates: Partial<SecureTask>, userId: string): Promise<void> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    if (!taskId || typeof taskId !== 'string') {
      throw new Error('Invalid task ID');
    }

    // Validate updates
    if (updates.title) {
      const validation = SecurityUtils.validateTaskInput(updates.title);
      if (!validation.isValid) {
        throw new Error('Invalid task title');
      }
      updates.title = validation.sanitized;
    }

    if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
      throw new Error('Invalid priority level');
    }

    try {
      const taskRef = doc(db, 'users', userId, 'tasks', taskId);
      
      // No need to verify ownership since we're already using the user's subcollection
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      console.log('Task updated successfully:', SecurityUtils.sanitizeForLog(taskId));
    } catch (error) {
      console.error('Error updating task:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to update task');
    }
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    if (!taskId || typeof taskId !== 'string') {
      throw new Error('Invalid task ID');
    }

    try {
      // No need to verify ownership since we're already using the user's subcollection
      await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
      console.log('Task deleted successfully:', SecurityUtils.sanitizeForLog(taskId));
    } catch (error) {
      console.error('Error deleting task:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to delete task');
    }
  }

  // Secure journal operations
  async addJournalEntry(title: string, content: string, mood: string, userId: string): Promise<string> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    const titleValidation = SecurityUtils.validateTaskInput(title);
    if (!titleValidation.isValid) {
      throw new Error('Invalid journal title');
    }

    // Validate content length
    if (!content || content.length > 10000) {
      throw new Error('Invalid journal content');
    }

    // Validate mood
    const validMoods = ['great', 'good', 'okay', 'tired', 'stressed'];
    if (!validMoods.includes(mood)) {
      throw new Error('Invalid mood');
    }

    try {
      const entryData: Omit<SecureJournalEntry, 'id'> = {
        title: titleValidation.sanitized,
        content: content.trim(),
        mood,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const userJournalCollection = collection(db, 'users', userId, 'journal_entries');
      const docRef = await addDoc(userJournalCollection, entryData);
      console.log('Journal entry added successfully:', SecurityUtils.sanitizeForLog(docRef.id));
      return docRef.id;
    } catch (error) {
      console.error('Error adding journal entry:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to add journal entry');
    }
  }

  async getJournalEntries(userId: string): Promise<SecureJournalEntry[]> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      const userJournalCollection = collection(db, 'users', userId, 'journal_entries');
      const q = query(
        userJournalCollection,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const entries: SecureJournalEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          mood: data.mood,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      return entries;
    } catch (error) {
      console.error('Error getting journal entries:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to retrieve journal entries');
    }
  }
}

export default new SecureFirestoreService();