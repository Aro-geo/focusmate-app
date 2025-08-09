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

class SecureDeepSeekService {
  private functions = getFunctions();

  async chat(message: string, context?: string): Promise<AIResponse> {
    try {
      const aiChat = httpsCallable(this.functions, 'aiChat');
      const result = await aiChat({ message, context });
      return result.data as AIResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async analyzeTask(task: string): Promise<TaskAnalysis> {
    try {
      const analyzeTask = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTask({ task });
      return result.data as TaskAnalysis;
    } catch (error) {
      console.error('Task analysis error:', error);
      throw new Error('Failed to analyze task');
    }
  }

  async prioritizeTasks(tasks: any[]): Promise<TaskPrioritization> {
    try {
      const prioritizeTasks = httpsCallable(this.functions, 'prioritizeTasks');
      const result = await prioritizeTasks({ tasks });
      return result.data as TaskPrioritization;
    } catch (error) {
      console.error('Task prioritization error:', error);
      throw new Error('Failed to prioritize tasks');
    }
  }

  async getProductivityTip(currentActivity?: string): Promise<string> {
    const context = currentActivity 
      ? `User is currently working on: ${currentActivity}` 
      : 'User wants general productivity advice';
    
    const response = await this.chat(
      'Give me a short productivity tip to help me stay focused.',
      context
    );
    
    return response.response;
  }

  async analyzeFocusSession(duration: number, completed: boolean, mood: string): Promise<string> {
    const message = `I just completed a ${duration}-minute focus session. 
                     Completion status: ${completed ? 'completed' : 'interrupted'}. 
                     My mood was: ${mood}. 
                     Give me brief feedback and suggestions for improvement.`;
    
    const response = await this.chat(message);
    return response.response;
  }

  async getJournalInsights(entry: string): Promise<string> {
    const message = `Analyze this journal entry and provide insights about productivity patterns, 
                     mood, and suggestions for improvement: "${entry}"`;
    
    const response = await this.chat(message);
    return response.response;
  }
}

export default new SecureDeepSeekService();