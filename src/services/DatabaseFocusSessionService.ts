import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export interface FocusSession {
  id?: string;
  userId: string;
  sessionType: 'pomodoro' | 'focus' | 'break' | 'custom';
  durationMinutes: number;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
  taskId?: string;
  createdAt: Date;
}

class DatabaseFocusSessionService {
  /**
   * Create a new focus session in Firestore
   */
  async createSession(session: Omit<FocusSession, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const userSessionsCollection = collection(db, 'users', user.uid, 'sessions');
    
    const sessionData = {
      userId: user.uid,
      sessionType: session.sessionType,
      durationMinutes: session.durationMinutes,
      startedAt: session.startedAt,
      completedAt: session.completedAt || null,
      notes: session.notes || '',
      taskId: session.taskId || '',
      createdAt: now
    };
    
    const docRef = await addDoc(userSessionsCollection, sessionData);
    return docRef.id;
  }

  /**
   * Get all sessions for the current user
   */
  async getSessions(): Promise<FocusSession[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userSessionsCollection = collection(db, 'users', user.uid, 'sessions');
    const q = query(
      userSessionsCollection,
      orderBy('startedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        sessionType: data.sessionType,
        durationMinutes: data.durationMinutes,
        startedAt: data.startedAt.toDate(),
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
        notes: data.notes,
        taskId: data.taskId,
        createdAt: data.createdAt.toDate()
      } as FocusSession;
    });
  }

  /**
   * Update a session (e.g., to mark it as completed)
   */
  async updateSession(sessionId: string, updates: Partial<FocusSession>): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    
    // Convert Date objects to Firestore Timestamps
    const firestoreUpdates: any = { ...updates };
    if (updates.startedAt) firestoreUpdates.startedAt = Timestamp.fromDate(updates.startedAt);
    if (updates.completedAt) firestoreUpdates.completedAt = Timestamp.fromDate(updates.completedAt);
    if (updates.createdAt) firestoreUpdates.createdAt = Timestamp.fromDate(updates.createdAt);
    
    await updateDoc(sessionRef, firestoreUpdates);
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    await deleteDoc(doc(db, 'users', user.uid, 'sessions', sessionId));
  }

  /**
   * Get sessions for a specific time period
   */
  async getSessionsForPeriod(startDate: Date, endDate: Date): Promise<FocusSession[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userSessionsCollection = collection(db, 'users', user.uid, 'sessions');
    const q = query(
      userSessionsCollection,
      where('startedAt', '>=', Timestamp.fromDate(startDate)),
      where('startedAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('startedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        sessionType: data.sessionType,
        durationMinutes: data.durationMinutes,
        startedAt: data.startedAt.toDate(),
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
        notes: data.notes,
        taskId: data.taskId,
        createdAt: data.createdAt.toDate()
      } as FocusSession;
    });
  }
}

export default new DatabaseFocusSessionService();
