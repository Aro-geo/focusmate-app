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
  tags?: string[];
  attachments?: string[];
  sentiment?: {
    score: number;
    analysis: string;
  };
  isPrivate?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class SecureFirestoreService {
  private validateUserId(userId: string): boolean {
    if (!userId) {
      console.error('Invalid user ID: userId is null or undefined');
      return false;
    }
    
    if (typeof userId !== 'string') {
      console.error(`Invalid user ID: expected string but got ${typeof userId}`);
      return false;
    }
    
    if (userId.length === 0 || userId.length >= 128) {
      console.error(`Invalid user ID: length ${userId.length} is outside valid range (1-127 chars)`);
      return false;
    }
    
    return true;
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

  async getJournalEntries(userId: string): Promise<SecureJournalEntry[]> {
    console.log('getJournalEntries called with userId:', typeof userId, userId ? userId.substring(0, 5) + '...' : 'null/undefined');
    
    if (!this.validateUserId(userId)) {
      console.error('Invalid user ID in getJournalEntries:', userId);
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
          tags: data.tags || [],
          attachments: data.attachments || [],
          isPrivate: data.isPrivate || false,
          sentiment: data.sentiment,
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
  
  // Advanced AI Journal functions
  async updateJournalSentiment(journalId: string, userId: string, sentiment: { score: number, analysis: string }): Promise<void> {
    if (!this.validateUserId(userId) || !journalId) {
      throw new Error('Invalid user ID or journal ID');
    }

    try {
      const journalRef = doc(db, 'users', userId, 'journal_entries', journalId);
      await updateDoc(journalRef, { 
        sentiment, 
        updatedAt: Timestamp.now() 
      });
    } catch (error) {
      console.error('Error updating journal sentiment:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to update journal sentiment');
    }
  }
  
  async getJournalStats(userId: string): Promise<any> {
    console.log('getJournalStats called with userId:', typeof userId, userId ? userId.substring(0, 5) + '...' : 'null/undefined');
    
    if (!this.validateUserId(userId)) {
      console.error('Invalid user ID in getJournalStats:', userId);
      throw new Error('Invalid user ID');
    }

    try {
      const userJournalCollection = collection(db, 'users', userId, 'journal_entries');
      const q = query(userJournalCollection);
      const querySnapshot = await getDocs(q);
      
      // Prepare stats
      const moodCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      let totalEntries = 0;
      let averageSentiment = 0;
      const entriesByDate: Record<string, number> = {};
      
      // Process entries
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalEntries++;
        
        // Count moods
        moodCounts[data.mood] = (moodCounts[data.mood] || 0) + 1;
        
        // Count tags
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
        
        // Track sentiment scores
        if (data.sentiment && typeof data.sentiment.score === 'number') {
          averageSentiment += data.sentiment.score;
        }
        
        // Track entries by date
        const date = data.createdAt.toDate().toISOString().split('T')[0];
        entriesByDate[date] = (entriesByDate[date] || 0) + 1;
      });
      
      // Calculate averages
      if (totalEntries > 0) {
        averageSentiment = averageSentiment / totalEntries;
      }
      
      // Calculate streak
      const dates = Object.keys(entriesByDate).sort();
      let currentStreak = 0;
      let longestStreak = 0;
      let lastDate: Date | undefined;
      
      dates.forEach((dateStr) => {
        const date = new Date(dateStr);
        
        if (!lastDate) {
          currentStreak = 1;
        } else {
          // Check if this date is one day after the last date
          const dayDiff = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
            currentStreak++;
          } else if (dayDiff > 1) {
            // Streak broken
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak;
            }
            currentStreak = 1;
          }
        }
        
        lastDate = date;
      });
      
      // Check if current streak is the longest
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      return {
        totalEntries,
        moodCounts,
        tagCounts,
        averageSentiment,
        streak: {
          current: currentStreak,
          longest: longestStreak,
          lastEntryDate: lastDate ? lastDate.toISOString().split('T')[0] : ''
        },
        entriesByDate
      };
    } catch (error) {
      console.error('Error getting journal stats:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to retrieve journal stats');
    }
  }
  
  async deleteJournalEntry(entryId: string, userId: string): Promise<void> {
    if (!this.validateUserId(userId) || !entryId) {
      throw new Error('Invalid user ID or entry ID');
    }

    try {
      const entryRef = doc(db, 'users', userId, 'journal_entries', entryId);
      await deleteDoc(entryRef);
    } catch (error) {
      console.error('Error deleting journal entry:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to delete journal entry');
    }
  }
  
  async exportJournalEntries(userId: string): Promise<SecureJournalEntry[]> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      const userJournalCollection = collection(db, 'users', userId, 'journal_entries');
      const q = query(
        userJournalCollection,
        orderBy('createdAt', 'desc')
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
          tags: data.tags || [],
          attachments: data.attachments || [],
          isPrivate: data.isPrivate || false,
          sentiment: data.sentiment,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      return entries;
    } catch (error) {
      console.error('Error exporting journal entries:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to export journal entries');
    }
  }
  
  async addJournalEntry(entry: Partial<SecureJournalEntry>, userId: string): Promise<string> {
    console.log('addJournalEntry called with userId:', typeof userId, userId ? userId.substring(0, 5) + '...' : 'null/undefined');
    
    if (!this.validateUserId(userId)) {
      console.error('Invalid user ID in addJournalEntry:', userId);
      throw new Error('Invalid user ID');
    }

    try {
      const now = Timestamp.now();
      const entryData: Omit<SecureJournalEntry, 'id'> = {
        title: entry.title || 'Untitled Entry',
        content: entry.content || '',
        mood: entry.mood || 'neutral',
        userId: userId,
        tags: entry.tags || [],
        attachments: entry.attachments || [],
        isPrivate: entry.isPrivate || false,
        createdAt: now,
        updatedAt: now
      };
      
      // Create document reference
      const userJournalCollection = collection(db, 'users', userId, 'journal_entries');
      const docRef = await addDoc(userJournalCollection, entryData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding journal entry:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to add journal entry');
    }
  }
}

export default new SecureFirestoreService();