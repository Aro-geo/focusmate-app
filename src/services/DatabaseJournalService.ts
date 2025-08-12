import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export interface JournalEntry {
  id?: string;
  userId: string;
  content: string;
  title?: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

class DatabaseJournalService {
  /**
   * Create a new journal entry in Firestore
   */
  async createEntry(entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const userEntriesCollection = collection(db, 'users', user.uid, 'journalEntries');
    
    const entryData = {
      userId: user.uid,
      content: entry.content,
      title: entry.title || '',
      mood: entry.mood || '',
      tags: entry.tags || [],
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };
    
    const docRef = await addDoc(userEntriesCollection, entryData);
    return docRef.id;
  }

  /**
   * Get all journal entries for the current user
   */
  async getEntries(): Promise<JournalEntry[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userEntriesCollection = collection(db, 'users', user.uid, 'journalEntries');
    const q = query(
      userEntriesCollection,
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        content: data.content,
        title: data.title,
        mood: data.mood,
        tags: data.tags,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as JournalEntry;
    });
  }

  /**
   * Update a journal entry
   */
  async updateEntry(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const entryRef = doc(db, 'users', user.uid, 'journalEntries', entryId);
    
    // Convert Date objects to Firestore Timestamps
    const firestoreUpdates: any = { ...updates };
    if (updates.createdAt) firestoreUpdates.createdAt = Timestamp.fromDate(updates.createdAt);
    firestoreUpdates.updatedAt = Timestamp.fromDate(new Date());
    
    await updateDoc(entryRef, firestoreUpdates);
  }

  /**
   * Delete a journal entry
   */
  async deleteEntry(entryId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    await deleteDoc(doc(db, 'users', user.uid, 'journalEntries', entryId));
  }

  /**
   * Search journal entries by content or tags
   */
  async searchEntries(searchTerm: string): Promise<JournalEntry[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const entries = await this.getEntries();
    
    return entries.filter(entry => 
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  /**
   * Get journal entries for a specific time period
   */
  async getEntriesForPeriod(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userEntriesCollection = collection(db, 'users', user.uid, 'journalEntries');
    const q = query(
      userEntriesCollection,
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        content: data.content,
        title: data.title,
        mood: data.mood,
        tags: data.tags,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as JournalEntry;
    });
  }
}

export default new DatabaseJournalService();
