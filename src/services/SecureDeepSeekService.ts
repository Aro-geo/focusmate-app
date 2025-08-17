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

type UseCase = 'coding' | 'analysis' | 'conversation' | 'translation' | 'creative';

class SecureDeepSeekService {
  private functions = getFunctions();

  private getTemperature(useCase: UseCase): number {
    const temperatures = {
      coding: 0.0,      // Coding / Math
      analysis: 1.0,    // Data Analysis
      conversation: 1.3, // General Conversation
      translation: 1.3, // Translation
      creative: 1.5     // Creative Writing
    };
    return temperatures[useCase];
  }

  async chat(message: string, context?: string, useCase: UseCase = 'conversation'): Promise<AIResponse> {
    try {
      const aiChat = httpsCallable(this.functions, 'aiChat');
      const result = await aiChat({
        message,
        context,
        model: 'deepseek-chat',
        temperature: this.getTemperature(useCase)
      });
      return result.data as AIResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async analyzeTask(task: string): Promise<TaskAnalysis> {
    try {
      const analyzeTask = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTask({
        task,
        model: 'deepseek-chat',
        temperature: this.getTemperature('analysis')
      });
      return result.data as TaskAnalysis;
    } catch (error) {
      console.error('Task analysis error:', error);
      throw new Error('Failed to analyze task');
    }
  }

  // Removed prioritizeTasks function to avoid token consumption and performance issues
  // Use chat() function instead for AI-powered task suggestions

  async getProductivityTip(currentActivity?: string): Promise<string> {
    const context = currentActivity
      ? `User is currently working on: ${currentActivity}`
      : 'User wants general productivity advice';

    const response = await this.chat(
      'Give me a short productivity tip to help me stay focused.',
      context,
      'conversation'
    );

    return response.response;
  }

  async analyzeFocusSession(duration: number, completed: boolean, mood: string): Promise<string> {
    const message = `I just completed a ${duration}-minute focus session. 
                     Completion status: ${completed ? 'completed' : 'interrupted'}. 
                     My mood was: ${mood}. 
                     Give me brief feedback and suggestions for improvement.`;

    const response = await this.chat(message, undefined, 'analysis');
    return response.response;
  }

  async getJournalInsights(entry: string): Promise<string> {
    const message = `Analyze this journal entry and provide insights about productivity patterns, 
                     mood, and suggestions for improvement: "${entry}"`;

    const response = await this.chat(message, undefined, 'analysis');
    return response.response;
  }

  async generateCreativeContent(prompt: string, context?: string): Promise<string> {
    const response = await this.chat(prompt, context, 'creative');
    return response.response;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const message = `Translate the following text to ${targetLanguage}: "${text}"`;
    const response = await this.chat(message, undefined, 'translation');
    return response.response;
  }

  async generateCode(description: string, language: string): Promise<string> {
    const message = `Generate ${language} code for: ${description}`;
    const response = await this.chat(message, undefined, 'coding');
    return response.response;
  }
}

export default new SecureDeepSeekService();
export type { UseCase };