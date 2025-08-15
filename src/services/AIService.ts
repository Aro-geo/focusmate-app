import { getFunctions, httpsCallable } from 'firebase/functions';

export interface AIResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TaskAnalysis {
  analysis: string;
  complexity: string;
  estimatedTime: number;
  priority: string;
  suggestions: string[];
}

export interface TaskPrioritization {
  aiSuggestion: string;
  prioritizedTasks: any[];
}

class AIService {
  private functions = getFunctions();

  async chat(message: string, context?: string): Promise<AIResponse> {
    try {
      const aiChat = httpsCallable(this.functions, 'aiChat');
      const result = await aiChat({ message, context });
      return result.data as AIResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      // Return a fallback response without revealing the AI provider
      return {
        response: "Sorry, I seem to be having a moment here. Can you try again in a bit? My brain might need a coffee break!"
      };
    }
  }

  async analyzeTask(task: string): Promise<TaskAnalysis> {
    try {
      const analyzeTask = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTask({ task });
      return result.data as TaskAnalysis;
    } catch (error) {
      console.error('Task analysis error:', error);
      return {
        analysis: "Hmm, I can't quite wrap my head around this task right now. Could you add a bit more detail so I can help you better?",
        complexity: "medium",
        estimatedTime: 30,
        priority: "medium",
        suggestions: ["Maybe break this into smaller steps", "Try setting a specific deadline"]
      };
    }
  }

  // Removed prioritizeTasks function to avoid token consumption and performance issues
  // Use chat() function instead for AI-powered task suggestions

  async getProductivityTip(currentActivity?: string): Promise<string> {
    try {
      const getProductivityTip = httpsCallable(this.functions, 'getProductivityTip');
      const result = await getProductivityTip({ currentActivity });
      return (result.data as AIResponse).response;
    } catch (error) {
      console.error('Productivity tip error:', error);
      return "Here's a little tip for you: Try using the Pomodoro technique - work focused for 25 minutes, then take a quick 5-minute break. It's amazing how much this simple rhythm can boost your energy!";
    }
  }

  async analyzeFocusSession(
    duration: number,
    completed: boolean,
    mood: string
  ): Promise<string> {
    try {
      const analyzeFocusSession = httpsCallable(this.functions, 'analyzeFocusSession');
      const result = await analyzeFocusSession({ duration, completed, mood });
      return (result.data as AIResponse).response;
    } catch (error) {
      console.error('Focus session analysis error:', error);
      return "Great job on your focus session! Even if it wasn't perfect, showing up is half the battle. Remember that consistent small efforts add up to big results over time. Keep it up!";
    }
  }

  async analyzeJournal(entries: string[]): Promise<{ insights: string; suggestions: string[] }> {
    try {
      const analyzeJournal = httpsCallable(this.functions, 'analyzeJournal');
      const result = await analyzeJournal({ entries });
      return result.data as { insights: string; suggestions: string[] };
    } catch (error) {
      console.error('Journal analysis error:', error);
      return {
        insights: "Based on your journal entries, you've been making progress on your goals.",
        suggestions: [
          "Try to identify patterns in your productive days",
          "Consider setting up a dedicated focus environment",
          "The Pomodoro technique seems to be working well for you"
        ]
      };
    }
  }

  async getJournalInsights(entry: string): Promise<{ insights: string; suggestions: string[] }> {
    try {
      const getJournalInsights = httpsCallable(this.functions, 'getJournalInsights');
      const result = await getJournalInsights({ entry });
      const data = result.data as { insights: string; suggestions: string[] };
      return data;
    } catch (error) {
      console.error('Journal insights error:', error);
      return {
        insights: "I can see you've been thinking about your day and what you've accomplished. That kind of reflection is super valuable for personal growth!",
        suggestions: [
          "Why not jot down a couple specific goals for tomorrow? Even small ones can set a positive tone for the day",
          "It might be helpful to think about what made you feel most energized today and how you can create more of those moments"
        ]
      };
    }
  }
}

// Create and export a singleton instance
const aiService = new AIService();
export default aiService;
