import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface AIFocusTip {
  id?: string;
  title: string;
  content: string;
  category: 'time-management' | 'motivation' | 'break-strategies' | 'focus-techniques' | 'productivity' | 'other';
  source: 'ai-coach' | 'user-note';
  sessionId?: string;
  createdAt: Date;
}

class AIFocusTipsService {
  async saveTip(tip: Omit<AIFocusTip, 'id' | 'createdAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userTipsCollection = collection(db, 'users', user.uid, 'focusTips');
    const docRef = await addDoc(userTipsCollection, {
      ...tip,
      createdAt: Timestamp.fromDate(new Date())
    });
    return docRef.id;
  }

  async getTips(): Promise<AIFocusTip[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userTipsCollection = collection(db, 'users', user.uid, 'focusTips');
    const q = query(userTipsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as AIFocusTip));
  }

  async getTipsByCategory(category: AIFocusTip['category']): Promise<AIFocusTip[]> {
    const tips = await this.getTips();
    return tips.filter(tip => tip.category === category);
  }

  async deleteTip(tipId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'users', user.uid, 'focusTips', tipId));
  }

  extractTipFromAIMessage(message: string): { title: string; content: string; category: AIFocusTip['category'] } | null {
    // Extract title from markdown headers
    const titleMatch = message.match(/##\s*(.+)/);
    if (!titleMatch) return null;

    const title = titleMatch[1].replace(/[🎯💡⚡🧠🔥✨]/g, '').trim();
    
    // Determine category based on keywords
    const lowerMessage = message.toLowerCase();
    let category: AIFocusTip['category'] = 'other';
    
    if (lowerMessage.includes('time') || lowerMessage.includes('pomodoro') || lowerMessage.includes('schedule')) {
      category = 'time-management';
    } else if (lowerMessage.includes('break') || lowerMessage.includes('rest') || lowerMessage.includes('stretch')) {
      category = 'break-strategies';
    } else if (lowerMessage.includes('focus') || lowerMessage.includes('concentration') || lowerMessage.includes('distraction')) {
      category = 'focus-techniques';
    } else if (lowerMessage.includes('motivat') || lowerMessage.includes('goal') || lowerMessage.includes('streak')) {
      category = 'motivation';
    } else if (lowerMessage.includes('productiv') || lowerMessage.includes('efficient') || lowerMessage.includes('task')) {
      category = 'productivity';
    }

    return { title, content: message, category };
  }
}

export const aiFocusTipsService = new AIFocusTipsService();