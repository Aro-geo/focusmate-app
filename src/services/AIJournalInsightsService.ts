interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIInsight {
  id: string;
  type: 'emotion' | 'pattern' | 'suggestion' | 'growth' | 'concern';
  title: string;
  description: string;
  confidence: number; // 0-1
  relatedEntries: string[];
  actionable?: string;
  timestamp: Date;
}

interface EmotionalAnalysis {
  dominantEmotion: string;
  emotionScore: number; // -1 to 1 (negative to positive)
  emotionTrends: Array<{
    date: string;
    emotion: string;
    score: number;
  }>;
  emotionalStability: number; // 0-1
}

interface ThoughtPattern {
  pattern: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  examples: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

class AIJournalInsightsService {
  private readonly AI_CHAT_ENDPOINT = 'https://aichat-juyojvwr7q-uc.a.run.app';

  /**
   * Generate comprehensive AI insights from journal entries
   */
  async generateInsights(entries: JournalEntry[]): Promise<AIInsight[]> {
    if (entries.length === 0) return [];

    try {
      const insights: AIInsight[] = [];

      // Analyze emotions
      const emotionalInsights = await this.analyzeEmotions(entries);
      insights.push(...emotionalInsights);

      // Analyze thought patterns
      const patternInsights = await this.analyzeThoughtPatterns(entries);
      insights.push(...patternInsights);

      // Generate growth insights
      const growthInsights = await this.analyzePersonalGrowth(entries);
      insights.push(...growthInsights);

      // Generate suggestions
      const suggestionInsights = await this.generateSuggestions(entries);
      insights.push(...suggestionInsights);

      return insights.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getFallbackInsights(entries);
    }
  }

  /**
   * Analyze emotional patterns in journal entries
   */
  private async analyzeEmotions(entries: JournalEntry[]): Promise<AIInsight[]> {
    const recentEntries = entries.slice(0, 10); // Analyze last 10 entries
    const entriesText = recentEntries.map(entry => 
      `Entry from ${entry.createdAt.toDateString()}: ${entry.content}`
    ).join('\n\n');

    const prompt = `Analyze the emotional patterns in these journal entries and provide insights:

${entriesText}

Please analyze:
1. Dominant emotions expressed
2. Emotional trends over time
3. Triggers for different emotions
4. Emotional stability patterns

Respond with specific, actionable insights about the person's emotional well-being.`;

    try {
      const response = await this.callAIService(prompt);
      return this.parseEmotionalInsights(response, recentEntries);
    } catch (error) {
      console.error('Error analyzing emotions:', error);
      return [];
    }
  }

  /**
   * Analyze recurring thought patterns
   */
  private async analyzeThoughtPatterns(entries: JournalEntry[]): Promise<AIInsight[]> {
    const entriesText = entries.slice(0, 15).map(entry => 
      `${entry.createdAt.toDateString()}: ${entry.content}`
    ).join('\n\n');

    const prompt = `Analyze the thought patterns and recurring themes in these journal entries:

${entriesText}

Identify:
1. Recurring thoughts or concerns
2. Cognitive patterns (positive/negative thinking)
3. Problem-solving approaches
4. Mental frameworks being used
5. Areas of focus or preoccupation

Provide insights about thinking patterns and mental habits.`;

    try {
      const response = await this.callAIService(prompt);
      return this.parsePatternInsights(response, entries.slice(0, 15));
    } catch (error) {
      console.error('Error analyzing thought patterns:', error);
      return [];
    }
  }

  /**
   * Analyze personal growth and development
   */
  private async analyzePersonalGrowth(entries: JournalEntry[]): Promise<AIInsight[]> {
    if (entries.length < 5) return [];

    const oldEntries = entries.slice(-10, -5); // Older entries
    const recentEntries = entries.slice(-5); // Recent entries

    const oldText = oldEntries.map(entry => entry.content).join('\n');
    const recentText = recentEntries.map(entry => entry.content).join('\n');

    const prompt = `Compare these older journal entries with recent ones to identify personal growth:

OLDER ENTRIES:
${oldText}

RECENT ENTRIES:
${recentText}

Analyze:
1. Changes in perspective or mindset
2. Personal development and growth
3. Improved coping strategies
4. New insights or realizations
5. Progress toward goals

Provide insights about personal growth and development patterns.`;

    try {
      const response = await this.callAIService(prompt);
      return this.parseGrowthInsights(response, [...oldEntries, ...recentEntries]);
    } catch (error) {
      console.error('Error analyzing personal growth:', error);
      return [];
    }
  }

  /**
   * Generate actionable suggestions based on journal content
   */
  private async generateSuggestions(entries: JournalEntry[]): Promise<AIInsight[]> {
    const recentEntries = entries.slice(0, 8);
    const entriesText = recentEntries.map(entry => 
      `${entry.createdAt.toDateString()}: ${entry.content}`
    ).join('\n\n');

    const prompt = `Based on these journal entries, provide personalized suggestions for improvement:

${entriesText}

Generate specific, actionable suggestions for:
1. Mental well-being and emotional health
2. Productivity and focus improvement
3. Relationship and social aspects
4. Personal development goals
5. Stress management and coping strategies

Make suggestions practical and tailored to this person's specific situation.`;

    try {
      const response = await this.callAIService(prompt);
      return this.parseSuggestionInsights(response, recentEntries);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Call the AI service with a prompt
   */
  private async callAIService(prompt: string): Promise<string> {
    const response = await fetch(this.AI_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          message: prompt,
          context: 'journal_analysis',
          model: 'deepseek-chat',
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.response || data.result || '';
  }

  /**
   * Parse emotional insights from AI response
   */
  private parseEmotionalInsights(response: string, entries: JournalEntry[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const lines = response.split('\n').filter(line => line.trim());

    // Extract key emotional insights
    for (const line of lines) {
      if (line.toLowerCase().includes('emotion') || line.toLowerCase().includes('feeling')) {
        insights.push({
          id: `emotion-${Date.now()}-${Math.random()}`,
          type: 'emotion',
          title: 'Emotional Pattern Detected',
          description: line.trim(),
          confidence: 0.8,
          relatedEntries: entries.slice(0, 3).map(e => e.id),
          timestamp: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Parse thought pattern insights from AI response
   */
  private parsePatternInsights(response: string, entries: JournalEntry[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const lines = response.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.toLowerCase().includes('pattern') || line.toLowerCase().includes('recurring')) {
        insights.push({
          id: `pattern-${Date.now()}-${Math.random()}`,
          type: 'pattern',
          title: 'Thought Pattern Identified',
          description: line.trim(),
          confidence: 0.75,
          relatedEntries: entries.slice(0, 5).map(e => e.id),
          timestamp: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Parse growth insights from AI response
   */
  private parseGrowthInsights(response: string, entries: JournalEntry[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const lines = response.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.toLowerCase().includes('growth') || line.toLowerCase().includes('progress') || line.toLowerCase().includes('development')) {
        insights.push({
          id: `growth-${Date.now()}-${Math.random()}`,
          type: 'growth',
          title: 'Personal Growth Observed',
          description: line.trim(),
          confidence: 0.85,
          relatedEntries: entries.map(e => e.id),
          timestamp: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Parse suggestion insights from AI response
   */
  private parseSuggestionInsights(response: string, entries: JournalEntry[]): AIInsight[] {
    const insights: AIInsight[] = [];
    const lines = response.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('recommend') || line.toLowerCase().includes('try')) {
        insights.push({
          id: `suggestion-${Date.now()}-${Math.random()}`,
          type: 'suggestion',
          title: 'AI Suggestion',
          description: line.trim(),
          confidence: 0.7,
          relatedEntries: entries.slice(0, 3).map(e => e.id),
          actionable: line.trim(),
          timestamp: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Provide fallback insights when AI service fails
   */
  private getFallbackInsights(entries: JournalEntry[]): AIInsight[] {
    const insights: AIInsight[] = [];

    if (entries.length > 0) {
      // Basic word frequency analysis
      const allText = entries.map(e => e.content.toLowerCase()).join(' ');
      const words = allText.split(/\s+/).filter(word => word.length > 3);
      const wordCount = words.length;

      // Analyze writing frequency
      const recentEntries = entries.slice(0, 7); // Last 7 entries
      const avgWordsPerEntry = Math.round(wordCount / entries.length);

      insights.push({
        id: 'fallback-activity',
        type: 'pattern',
        title: 'Journal Activity Analysis',
        description: `You've written ${entries.length} journal entries with an average of ${avgWordsPerEntry} words per entry. ${entries.length > 10 ? 'Your consistent journaling habit shows strong commitment to self-reflection.' : 'Keep building your journaling habit for deeper insights.'}`,
        confidence: 0.9,
        relatedEntries: entries.slice(0, 5).map(e => e.id),
        timestamp: new Date()
      });

      // Check for mood patterns if available
      const moodEntries = entries.filter(e => e.mood);
      if (moodEntries.length > 0) {
        const moodCounts = moodEntries.reduce((acc, entry) => {
          acc[entry.mood!] = (acc[entry.mood!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dominantMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
        const moodPercentage = Math.round((dominantMood[1] / moodEntries.length) * 100);
        
        insights.push({
          id: 'fallback-mood',
          type: 'emotion',
          title: 'Emotional Pattern',
          description: `Your most frequent mood is "${dominantMood[0]}" (${moodPercentage}% of entries). ${dominantMood[0] === 'happy' || dominantMood[0] === 'excited' ? 'This positive trend suggests good emotional well-being.' : dominantMood[0] === 'neutral' ? 'Consider exploring what brings you joy and energy.' : 'Consider what activities or practices help improve your mood.'}`,
          confidence: 0.8,
          relatedEntries: moodEntries.slice(0, 3).map(e => e.id),
          timestamp: new Date()
        });
      }

      // Analyze common themes
      const commonWords = this.getCommonWords(allText);
      if (commonWords.length > 0) {
        const topTheme = commonWords[0];
        insights.push({
          id: 'fallback-themes',
          type: 'pattern',
          title: 'Common Themes',
          description: `The word "${topTheme.word}" appears frequently in your entries (${topTheme.count} times). This suggests it's an important theme in your life right now.`,
          confidence: 0.7,
          relatedEntries: entries.slice(0, 3).map(e => e.id),
          timestamp: new Date()
        });
      }

      // Provide multiple suggestions and insights
      insights.push({
        id: 'fallback-suggestion',
        type: 'suggestion',
        title: 'Journaling Tip',
        description: entries.length < 5 
          ? 'Try to journal consistently for a week to start seeing patterns in your thoughts and emotions.'
          : entries.length < 15
          ? 'Consider adding specific goals or gratitude items to your entries for more structured reflection.'
          : 'You have a solid journaling foundation! Try reviewing your past entries monthly to track your personal growth.',
        confidence: 0.8,
        relatedEntries: entries.slice(0, 2).map(e => e.id),
        timestamp: new Date()
      });

      // Analyze writing consistency
      if (entries.length > 3) {
        const dates = entries.map(e => new Date(e.createdAt).toDateString());
        const uniqueDates = new Set(dates);
        const consistency = uniqueDates.size / entries.length;
        
        insights.push({
          id: 'fallback-consistency',
          type: 'pattern',
          title: 'Writing Consistency',
          description: consistency > 0.8 
            ? `You write consistently across different days (${uniqueDates.size} unique days). This regular practice helps build self-awareness.`
            : consistency > 0.5
            ? `You have moderate writing consistency. Try spreading your entries across more days for better habit formation.`
            : `You tend to write multiple entries on the same days. Consider spreading your journaling across more days for consistent reflection.`,
          confidence: 0.7,
          relatedEntries: entries.slice(0, 3).map(e => e.id),
          timestamp: new Date()
        });
      }

      // Analyze entry length patterns
      const entryLengths = entries.map(e => e.content.length);
      const avgLength = entryLengths.reduce((a, b) => a + b, 0) / entryLengths.length;
      const shortEntries = entryLengths.filter(l => l < avgLength * 0.5).length;
      const longEntries = entryLengths.filter(l => l > avgLength * 1.5).length;

      if (entryLengths.length > 2) {
        insights.push({
          id: 'fallback-length',
          type: 'pattern',
          title: 'Writing Style Analysis',
          description: avgLength > 500 
            ? `You write detailed entries (average ${Math.round(avgLength)} characters). This depth allows for thorough self-reflection.`
            : avgLength > 200
            ? `You write moderate-length entries (average ${Math.round(avgLength)} characters). Consider occasionally writing longer entries for deeper insights.`
            : `You prefer concise entries (average ${Math.round(avgLength)} characters). Sometimes longer entries can reveal more insights.`,
          confidence: 0.6,
          relatedEntries: entries.slice(0, 2).map(e => e.id),
          timestamp: new Date()
        });
      }

      // Analyze tags if available
      const allTags = entries.flatMap(e => e.tags || []);
      if (allTags.length > 0) {
        const tagCounts = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);

        insights.push({
          id: 'fallback-tags',
          type: 'pattern',
          title: 'Topic Focus',
          description: `Your most common topics are: ${topTags.map(([tag, count]) => `"${tag}" (${count} times)`).join(', ')}. These themes seem to be important areas of focus in your life.`,
          confidence: 0.7,
          relatedEntries: entries.filter(e => e.tags?.includes(topTags[0][0])).slice(0, 3).map(e => e.id),
          timestamp: new Date()
        });
      }

      // Time-based insights
      const timePatterns = this.analyzeTimePatterns(entries);
      if (timePatterns) {
        insights.push(timePatterns);
      }

      // Growth insights
      if (entries.length > 5) {
        const recentEntries = entries.slice(0, Math.floor(entries.length / 2));
        const olderEntries = entries.slice(Math.floor(entries.length / 2));
        
        const recentAvgLength = recentEntries.reduce((sum, e) => sum + e.content.length, 0) / recentEntries.length;
        const olderAvgLength = olderEntries.reduce((sum, e) => sum + e.content.length, 0) / olderEntries.length;
        
        const lengthChange = ((recentAvgLength - olderAvgLength) / olderAvgLength) * 100;
        
        if (Math.abs(lengthChange) > 20) {
          insights.push({
            id: 'fallback-growth',
            type: 'growth',
            title: 'Writing Evolution',
            description: lengthChange > 0 
              ? `Your recent entries are ${Math.round(lengthChange)}% longer than earlier ones, suggesting deeper reflection over time.`
              : `Your recent entries are ${Math.round(Math.abs(lengthChange))}% shorter than earlier ones. You may be becoming more concise or focused.`,
            confidence: 0.6,
            relatedEntries: [...recentEntries.slice(0, 2), ...olderEntries.slice(0, 1)].map(e => e.id),
            timestamp: new Date()
          });
        }
      }

      // Emotional journey insight
      if (moodEntries.length > 3) {
        const moodTrend = this.analyzeMoodTrend(moodEntries);
        if (moodTrend) {
          insights.push(moodTrend);
        }
      }
    }

    return insights;
  }

  private getCommonWords(text: string): Array<{word: string, count: number}> {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'as', 'if', 'each', 'how', 'when', 'where', 'why']);
    
    const wordCounts: Record<string, number> = {};
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(wordCounts)
      .map(([word, count]) => ({word, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private analyzeTimePatterns(entries: JournalEntry[]): AIInsight | null {
    const timeData = entries.map(entry => ({
      hour: new Date(entry.createdAt).getHours(),
      date: entry.createdAt
    }));

    const hourCounts = timeData.reduce((acc, {hour}) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostCommonHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonHour && parseInt(mostCommonHour[0]) !== undefined) {
      const hour = parseInt(mostCommonHour[0]);
      const count = mostCommonHour[1];
      const percentage = Math.round((count / entries.length) * 100);

      let timeDescription = '';
      if (hour >= 5 && hour < 12) {
        timeDescription = 'morning';
      } else if (hour >= 12 && hour < 17) {
        timeDescription = 'afternoon';
      } else if (hour >= 17 && hour < 21) {
        timeDescription = 'evening';
      } else {
        timeDescription = 'late night/early morning';
      }

      return {
        id: 'fallback-time',
        type: 'pattern',
        title: 'Writing Time Preference',
        description: `You tend to write most often in the ${timeDescription} (${percentage}% of entries around ${hour}:00). This suggests when you're most reflective or have time for introspection.`,
        confidence: 0.6,
        relatedEntries: entries.slice(0, 3).map(e => e.id),
        timestamp: new Date()
      };
    }

    return null;
  }

  private analyzeMoodTrend(moodEntries: JournalEntry[]): AIInsight | null {
    if (moodEntries.length < 4) return null;

    const moodValues: Record<string, number> = {
      'sad': 1,
      'frustrated': 2,
      'tired': 3,
      'neutral': 4,
      'reflective': 5,
      'grateful': 6,
      'happy': 7,
      'productive': 8,
      'creative': 8,
      'excited': 9
    };

    const recentMoods = moodEntries.slice(0, Math.floor(moodEntries.length / 2));
    const olderMoods = moodEntries.slice(Math.floor(moodEntries.length / 2));

    const recentAvg = recentMoods.reduce((sum, entry) => sum + (moodValues[entry.mood!] || 4), 0) / recentMoods.length;
    const olderAvg = olderMoods.reduce((sum, entry) => sum + (moodValues[entry.mood!] || 4), 0) / olderMoods.length;

    const trend = recentAvg - olderAvg;

    if (Math.abs(trend) > 0.5) {
      return {
        id: 'fallback-mood-trend',
        type: 'emotion',
        title: 'Emotional Journey',
        description: trend > 0 
          ? `Your recent entries show an upward emotional trend. You seem to be feeling more positive lately compared to earlier entries.`
          : `Your recent entries show a more reflective or challenging emotional period compared to earlier entries. This is normal and shows you're processing life's ups and downs.`,
        confidence: 0.7,
        relatedEntries: [...recentMoods.slice(0, 2), ...olderMoods.slice(0, 1)].map(e => e.id),
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Get emotional analysis summary
   */
  async getEmotionalAnalysis(entries: JournalEntry[]): Promise<EmotionalAnalysis> {
    const moodEntries = entries.filter(e => e.mood);
    
    if (moodEntries.length === 0) {
      return {
        dominantEmotion: 'neutral',
        emotionScore: 0,
        emotionTrends: [],
        emotionalStability: 0.5
      };
    }

    // Simple analysis - in production, this would use more sophisticated AI
    const moodCounts = moodEntries.reduce((acc, entry) => {
      acc[entry.mood!] = (acc[entry.mood!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0];
    
    const emotionTrends = moodEntries.slice(0, 10).map(entry => ({
      date: entry.createdAt.toISOString().split('T')[0],
      emotion: entry.mood!,
      score: this.getMoodScore(entry.mood!)
    }));

    const avgScore = emotionTrends.reduce((sum, trend) => sum + trend.score, 0) / emotionTrends.length;
    const variance = emotionTrends.reduce((sum, trend) => sum + Math.pow(trend.score - avgScore, 2), 0) / emotionTrends.length;
    const stability = Math.max(0, 1 - variance);

    return {
      dominantEmotion: dominantMood[0],
      emotionScore: avgScore,
      emotionTrends,
      emotionalStability: stability
    };
  }

  private getMoodScore(mood: string): number {
    const moodScores: Record<string, number> = {
      'great': 1,
      'good': 0.7,
      'happy': 0.8,
      'excited': 0.9,
      'calm': 0.5,
      'neutral': 0,
      'okay': 0.2,
      'tired': -0.3,
      'stressed': -0.6,
      'anxious': -0.7,
      'sad': -0.8,
      'angry': -0.9,
      'depressed': -1
    };

    return moodScores[mood.toLowerCase()] || 0;
  }
}

export const aiJournalInsightsService = new AIJournalInsightsService();
export type { AIInsight, EmotionalAnalysis, ThoughtPattern };
export default aiJournalInsightsService;