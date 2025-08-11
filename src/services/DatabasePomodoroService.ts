import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js';

export interface PomodoroSession {
  id?: string;
  userId: string;
  taskName: string | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  sessionType: 'pomodoro' | 'shortBreak' | 'longBreak';
  completed: boolean;
  notes?: string;
  createdAt: Date;
}

class DatabasePomodoroService {
  /**
   * Save a new Pomodoro session
   */
  async saveSession(session: Omit<PomodoroSession, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const userSessionsCollection = collection(db, 'users', user.uid, 'pomodoroSessions');
    
    const sessionData = {
      userId: user.uid,
      taskName: session.taskName,
      startTime: Timestamp.fromDate(session.startTime),
      endTime: session.endTime ? Timestamp.fromDate(session.endTime) : null,
      durationMinutes: session.durationMinutes,
      sessionType: session.sessionType,
      completed: session.completed,
      notes: session.notes || '',
      createdAt: Timestamp.fromDate(now)
    };
    
    const docRef = await addDoc(userSessionsCollection, sessionData);
    return docRef.id;
  }

  /**
   * Get all Pomodoro sessions for the current user
   */
  async getSessions(): Promise<PomodoroSession[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userSessionsCollection = collection(db, 'users', user.uid, 'pomodoroSessions');
    const q = query(
      userSessionsCollection,
      orderBy('startTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        taskName: data.taskName,
        startTime: data.startTime.toDate(),
        endTime: data.endTime ? data.endTime.toDate() : null,
        durationMinutes: data.durationMinutes,
        sessionType: data.sessionType,
        completed: data.completed,
        notes: data.notes,
        createdAt: data.createdAt.toDate()
      } as PomodoroSession;
    });
  }

  /**
   * Get sessions for a specific time period
   */
  async getSessionsForPeriod(startDate: Date, endDate: Date): Promise<PomodoroSession[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userSessionsCollection = collection(db, 'users', user.uid, 'pomodoroSessions');
    const q = query(
      userSessionsCollection,
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        taskName: data.taskName,
        startTime: data.startTime.toDate(),
        endTime: data.endTime ? data.endTime.toDate() : null,
        durationMinutes: data.durationMinutes,
        sessionType: data.sessionType,
        completed: data.completed,
        notes: data.notes,
        createdAt: data.createdAt.toDate()
      } as PomodoroSession;
    });
  }

  /**
   * Update a session's notes or completion status
   */
  async updateSession(sessionId: string, updates: Partial<PomodoroSession>): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const sessionRef = doc(db, 'users', user.uid, 'pomodoroSessions', sessionId);
    
    // Convert Date objects to Firestore Timestamps
    const firestoreUpdates: any = { ...updates };
    if (updates.startTime) firestoreUpdates.startTime = Timestamp.fromDate(updates.startTime);
    if (updates.endTime) firestoreUpdates.endTime = Timestamp.fromDate(updates.endTime);
    if (updates.createdAt) firestoreUpdates.createdAt = Timestamp.fromDate(updates.createdAt);
    
    await updateDoc(sessionRef, firestoreUpdates);
  }
}

export default new DatabasePomodoroService();