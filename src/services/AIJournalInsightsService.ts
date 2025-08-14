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
      const words = allText.split(/\s+/);
      const wordCount = words.length;

      insights.push({
        id: 'fallback-activity',
        type: 'pattern',
        title: 'Journal Activity',
        description: `You've written ${entries.length} journal entries with a total of ${wordCount} words. Regular journaling shows commitment to self-reflection.`,
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
        
        insights.push({
          id: 'fallback-mood',
          type: 'emotion',
          title: 'Mood Pattern',
          description: `Your most frequently recorded mood is "${dominantMood[0]}" (${dominantMood[1]} times). Consider what factors contribute to this emotional state.`,
          confidence: 0.8,
          relatedEntries: moodEntries.slice(0, 3).map(e => e.id),
          timestamp: new Date()
        });
      }
    }

    return insights;
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