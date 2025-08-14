import SecureFirestoreService, { SecureJournalEntry } from './SecureFirestoreService';
import SecurityUtils from '../utils/SecurityUtils';

interface SentimentAnalysis {
  score: number;
  analysis: string;
}

interface AIInsight {
  type: string;
  content: string;
  confidence?: number;
}

export class JournalAIService {
  private firestoreService;

  constructor() {
    this.firestoreService = SecureFirestoreService;
  }

  /**
   * Analyze the sentiment of a journal entry
   * @param text The text to analyze
   * @returns A sentiment analysis object with score and analysis
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      // This is a simple implementation - in a real app, you would call an AI API
      // like OpenAI, Google Cloud Natural Language API, or Azure Text Analytics
      
      // Sample implementation using simple keyword analysis
      const positiveWords = ['happy', 'good', 'great', 'excellent', 'joy', 'wonderful', 'amazing', 'love'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'angry', 'upset', 'frustrated', 'hate'];
      
      const cleanText = text.toLowerCase();
      let score = 0.5; // Neutral starting point
      
      // Count positive and negative words
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) positiveCount += matches.length;
      });
      
      negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) negativeCount += matches.length;
      });
      
      // Calculate sentiment score (0-1 scale)
      const totalWords = positiveCount + negativeCount;
      if (totalWords > 0) {
        score = 0.5 + (0.5 * (positiveCount - negativeCount) / totalWords);
      }
      
      // Generate analysis
      let analysis = '';
      if (score > 0.7) {
        analysis = 'This entry has a very positive sentiment.';
      } else if (score > 0.55) {
        analysis = 'This entry has a somewhat positive sentiment.';
      } else if (score >= 0.45) {
        analysis = 'This entry has a neutral sentiment.';
      } else if (score >= 0.3) {
        analysis = 'This entry has a somewhat negative sentiment.';
      } else {
        analysis = 'This entry has a very negative sentiment.';
      }
      
      return { score, analysis };
    } catch (error) {
      console.error('Error analyzing sentiment:', SecurityUtils.sanitizeForLog(String(error)));
      return { score: 0.5, analysis: 'Unable to analyze sentiment.' };
    }
  }

  /**
   * Updates the sentiment analysis for a journal entry and saves it to the database
   * @param journalEntry The journal entry to analyze
   * @param userId The user ID
   */
  async updateJournalSentiment(journalEntry: SecureJournalEntry, userId: string): Promise<void> {
    try {
      const sentiment = await this.analyzeSentiment(journalEntry.content);
      
      if (!journalEntry.id) {
        console.error('Journal entry has no ID');
        return;
      }
      
      await this.firestoreService.updateJournalSentiment(journalEntry.id, userId, sentiment);
    } catch (error) {
      console.error('Error updating journal sentiment:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to update journal sentiment');
    }
  }

  /**
   * Analyzes a collection of journal entries to find insights and patterns
   * @param entries Array of journal entries
   * @returns Array of AI insights
   */
  async analyzeJournalTrends(entries: SecureJournalEntry[]): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      
      if (entries.length === 0) {
        return [{
          type: 'info',
          content: 'Start journaling regularly to receive personalized insights about your patterns and growth opportunities.',
          confidence: 0.9
        }];
      }
      
      // Collect mood data
      const moodCounts: Record<string, number> = {};
      const moodByDay: Record<string, string[]> = {};
      let totalSentiment = 0;
      let sentimentCount = 0;
      
      entries.forEach(entry => {
        // Count moods
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        
        // Group moods by day
        const day = entry.createdAt.toDate().toISOString().split('T')[0];
        if (!moodByDay[day]) {
          moodByDay[day] = [];
        }
        moodByDay[day].push(entry.mood);
        
        // Track sentiment
        if (entry.sentiment && typeof entry.sentiment.score === 'number') {
          totalSentiment += entry.sentiment.score;
          sentimentCount++;
        }
      });
      
      // Find most common mood
      let maxMood = '';
      let maxCount = 0;
      Object.entries(moodCounts).forEach(([mood, count]) => {
        if (count > maxCount) {
          maxMood = mood;
          maxCount = count;
        }
      });
      
      if (maxMood) {
        insights.push({
          type: 'mood_trend',
          content: `Your most common mood is "${maxMood}" (${Math.round((maxCount/entries.length)*100)}% of entries).`,
          confidence: 0.9
        });
      }
      
      // Calculate average sentiment
      if (sentimentCount > 0) {
        const avgSentiment = totalSentiment / sentimentCount;
        let sentimentTrend = '';
        
        if (avgSentiment > 0.7) {
          sentimentTrend = 'very positive';
        } else if (avgSentiment > 0.6) {
          sentimentTrend = 'positive';
        } else if (avgSentiment > 0.4) {
          sentimentTrend = 'neutral';
        } else if (avgSentiment > 0.3) {
          sentimentTrend = 'negative';
        } else {
          sentimentTrend = 'very negative';
        }
        
        insights.push({
          type: 'sentiment_trend',
          content: `Your overall journal sentiment is ${sentimentTrend}.`,
          confidence: 0.8
        });
      }
      
      // Detect mood patterns
      const daysWithMultipleEntries = Object.keys(moodByDay).filter(day => moodByDay[day].length > 1);
      if (daysWithMultipleEntries.length > 0) {
        let moodSwingCount = 0;
        
        daysWithMultipleEntries.forEach(day => {
          const moods = moodByDay[day];
          const uniqueMoods = new Set(moods);
          if (uniqueMoods.size > 1) {
            moodSwingCount++;
          }
        });
        
        const swingPercentage = Math.round((moodSwingCount / daysWithMultipleEntries.length) * 100);
        
        if (swingPercentage > 50) {
          insights.push({
            type: 'mood_variation',
            content: `You experience mood changes within the same day in ${swingPercentage}% of days with multiple entries.`,
            confidence: 0.7
          });
        }
      }
      
      // Analyze content for common topics
      const contentWords: Record<string, number> = {};
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'is', 'was', 'were', 'be', 'being', 'been'];
      
      entries.forEach(entry => {
        const words = entry.content.toLowerCase().split(/\W+/).filter(word => 
          word.length > 3 && !stopWords.includes(word)
        );
        
        words.forEach(word => {
          contentWords[word] = (contentWords[word] || 0) + 1;
        });
      });
      
      // Find common topics
      const sortedWords = Object.entries(contentWords).sort((a, b) => b[1] - a[1]);
      const topWords = sortedWords.slice(0, 5).map(([word]) => word);
      
      if (topWords.length > 0) {
        insights.push({
          type: 'frequent_topics',
          content: `Common themes in your journal: ${topWords.join(', ')}.`,
          confidence: 0.6
        });
      }
      
      // Add recommendation
      insights.push({
        type: 'recommendation',
        content: `Try journaling about topics outside your comfort zone to gain new perspectives and insights.`,
        confidence: 0.5
      });
      
      return insights;
    } catch (error) {
      console.error('Error analyzing journal trends:', SecurityUtils.sanitizeForLog(String(error)));
      return [{
        type: 'error',
        content: 'Unable to analyze your journal entries at this time.',
        confidence: 0.1
      }];
    }
  }

  /**
   * Generates topic suggestions based on previous journal entries
   * @param entries Previous journal entries
   * @returns Array of topic suggestions
   */
  async generateTopicSuggestions(entries: SecureJournalEntry[]): Promise<string[]> {
    try {
      if (entries.length === 0) {
        return [
          'Reflect on your day',
          'What are you grateful for today?',
          'What challenges did you face today?',
          'What made you smile today?',
          'Set your intentions for tomorrow'
        ];
      }
      
      // Extract unique tags from entries
      const tags = new Set<string>();
      entries.forEach(entry => {
        if (entry.tags && Array.isArray(entry.tags)) {
          entry.tags.forEach(tag => tags.add(tag));
        }
      });
      
      // Extract moods from entries
      const moods = new Set<string>();
      entries.forEach(entry => {
        if (entry.mood) {
          moods.add(entry.mood);
        }
      });
      
      const suggestions: string[] = [];
      
      // Add suggestions based on tags
      if (tags.size > 0) {
        const tagArray = Array.from(tags);
        for (let i = 0; i < Math.min(2, tagArray.length); i++) {
          suggestions.push(`Reflect more on the topic of "${tagArray[i]}"`);
        }
      }
      
      // Add suggestions based on moods
      if (moods.size > 0) {
        const moodArray = Array.from(moods);
        for (let i = 0; i < Math.min(2, moodArray.length); i++) {
          suggestions.push(`Explore why you've been feeling "${moodArray[i]}" lately`);
        }
      }
      
      // Add generic suggestions
      suggestions.push('What progress have you made on your goals?');
      suggestions.push('Describe a moment that stood out to you recently');
      
      // Fill remaining slots with default suggestions
      const defaultSuggestions = [
        'Write about something you learned recently',
        'What are you looking forward to?',
        'Describe a challenge you are currently facing',
        'What are you grateful for today?',
        'Reflect on changes you have noticed in yourself'
      ];
      
      while (suggestions.length < 8) {
        const randomIndex = Math.floor(Math.random() * defaultSuggestions.length);
        const suggestion = defaultSuggestions[randomIndex];
        if (!suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      }
      
      return suggestions.slice(0, 8);
    } catch (error) {
      console.error('Error generating topic suggestions:', SecurityUtils.sanitizeForLog(String(error)));
      return [
        'Reflect on your day',
        'What are you grateful for today?',
        'What challenges did you face today?',
        'What made you smile today?',
        'Set your intentions for tomorrow'
      ];
    }
  }
  
  /**
   * Generate more detailed insights about a specific journal entry
   */
  async analyzeJournalEntry(entry: SecureJournalEntry): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      
      // Analyze sentiment if not already present
      if (!entry.sentiment || typeof entry.sentiment.score !== 'number') {
        const sentiment = await this.analyzeSentiment(entry.content);
        insights.push({
          type: 'sentiment',
          content: sentiment.analysis,
          confidence: 0.8
        });
      } else {
        insights.push({
          type: 'sentiment',
          content: entry.sentiment.analysis,
          confidence: 0.8
        });
      }
      
      // Content length analysis
      const wordCount = entry.content.split(/\s+/).length;
      if (wordCount > 200) {
        insights.push({
          type: 'writing_style',
          content: 'This is a detailed entry. Detailed reflection often leads to deeper insights.',
          confidence: 0.7
        });
      } else if (wordCount < 50) {
        insights.push({
          type: 'writing_style',
          content: 'This is a brief entry. Consider expanding with more details for deeper reflection.',
          confidence: 0.7
        });
      }
      
      // Question detection
      const questionCount = (entry.content.match(/\?/g) || []).length;
      if (questionCount > 2) {
        insights.push({
          type: 'self_inquiry',
          content: 'You ask yourself many questions in this entry. Self-inquiry is a powerful tool for growth.',
          confidence: 0.6
        });
      }
      
      // Add a writing suggestion
      const writingSuggestions = [
        'Try exploring the "why" behind your feelings in your next entry.',
        'Consider writing about potential solutions to challenges mentioned in this entry.',
        'In your next entry, you might reflect on how this experience connects to your broader life patterns.',
        'Try writing a follow-up entry in a few days to see how your perspective on this topic evolves.'
      ];
      
      insights.push({
        type: 'writing_suggestion',
        content: writingSuggestions[Math.floor(Math.random() * writingSuggestions.length)],
        confidence: 0.5
      });
      
      return insights;
    } catch (error) {
      console.error('Error analyzing journal entry:', SecurityUtils.sanitizeForLog(String(error)));
      return [{
        type: 'error',
        content: 'Unable to analyze this journal entry at this time.',
        confidence: 0.1
      }];
    }
  }
}

export default new JournalAIService();
