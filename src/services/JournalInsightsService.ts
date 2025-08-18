import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface JournalInsight {
  id?: string;
  title: string;
  content: string;
  category: 'patterns' | 'takeaways' | 'reflections' | 'improvements' | 'goals' | 'other';
  sessionDate: Date;
  entryIds: string[];
  createdAt: Date;
}

class JournalInsightsService {
  async saveInsight(insight: Omit<JournalInsight, 'id' | 'createdAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userInsightsCollection = collection(db, 'users', user.uid, 'journalInsights');
    const docRef = await addDoc(userInsightsCollection, {
      ...insight,
      sessionDate: Timestamp.fromDate(insight.sessionDate),
      createdAt: Timestamp.fromDate(new Date())
    });
    return docRef.id;
  }

  async getInsights(): Promise<JournalInsight[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userInsightsCollection = collection(db, 'users', user.uid, 'journalInsights');
    const q = query(userInsightsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sessionDate: doc.data().sessionDate.toDate(),
      createdAt: doc.data().createdAt.toDate()
    } as JournalInsight));
  }

  async getInsightsByCategory(category: JournalInsight['category']): Promise<JournalInsight[]> {
    const insights = await this.getInsights();
    return insights.filter(insight => insight.category === category);
  }

  async deleteInsight(insightId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await deleteDoc(doc(db, 'users', user.uid, 'journalInsights', insightId));
  }

  generateInsightFromEntry(entryContent: string, entryId: string): { title: string; content: string; category: JournalInsight['category'] } | null {
    if (!entryContent.trim()) return null;

    const lowerContent = entryContent.toLowerCase();
    let category: JournalInsight['category'] = 'other';
    let title = '';
    let content = '';

    // Pattern detection
    if (lowerContent.includes('pattern') || lowerContent.includes('notice') || lowerContent.includes('trend')) {
      category = 'patterns';
      title = 'Pattern Identified';
      content = `Noticed a recurring pattern: ${entryContent.substring(0, 100)}...`;
    }
    // Key takeaways
    else if (lowerContent.includes('learned') || lowerContent.includes('takeaway') || lowerContent.includes('insight')) {
      category = 'takeaways';
      title = 'Key Learning';
      content = `Important takeaway: ${entryContent.substring(0, 100)}...`;
    }
    // Reflections
    else if (lowerContent.includes('reflect') || lowerContent.includes('think') || lowerContent.includes('realize')) {
      category = 'reflections';
      title = 'Personal Reflection';
      content = `Reflection: ${entryContent.substring(0, 100)}...`;
    }
    // Improvements
    else if (lowerContent.includes('improve') || lowerContent.includes('better') || lowerContent.includes('change')) {
      category = 'improvements';
      title = 'Area for Improvement';
      content = `Improvement opportunity: ${entryContent.substring(0, 100)}...`;
    }
    // Goals
    else if (lowerContent.includes('goal') || lowerContent.includes('plan') || lowerContent.includes('want to')) {
      category = 'goals';
      title = 'Goal Setting';
      content = `Goal identified: ${entryContent.substring(0, 100)}...`;
    }
    else {
      return null; // No clear insight category
    }

    return { title, content, category };
  }
}

export const journalInsightsService = new JournalInsightsService();