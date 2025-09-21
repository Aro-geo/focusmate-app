import { collection, addDoc, doc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import type { CalendarEvent, NewCalendarEvent } from '../../types/calendar';

class CalendarService {
  private getUserEventsCollection(userId: string) {
    return collection(db, 'users', userId, 'events');
  }

  async list(userId: string): Promise<CalendarEvent[]> {
    const q = query(this.getUserEventsCollection(userId), orderBy('start', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as CalendarEvent);
  }

  async create(userId: string, event: NewCalendarEvent): Promise<string> {
    const now = new Date().toISOString();
    const docRef = await addDoc(this.getUserEventsCollection(userId), {
      ...event,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  }

  async update(userId: string, id: string, patch: Partial<NewCalendarEvent>): Promise<void> {
    const ref = doc(db, 'users', userId, 'events', id);
    await updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() });
  }

  async remove(userId: string, id: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'events', id);
    await deleteDoc(ref);
  }
}

const calendarService = new CalendarService();
export default calendarService;
