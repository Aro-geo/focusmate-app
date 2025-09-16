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
  private firebaseRegion = 'us-central1';
  private firebaseProjectId = 'focusmate-ai-8cad6';

  private get functionsUrl() {
    return `https://${this.firebaseRegion}-${this.firebaseProjectId}.cloudfunctions.net`;
  }

  private getModelConfig(useCase: UseCase): {model: string; temperature: number} {
    switch (useCase) {
      case 'coding':
        return {model: 'deepseek-reasoner', temperature: 0.0};
      case 'analysis':
        return {model: 'deepseek-reasoner', temperature: 1.0};
      case 'conversation':
        return {model: 'deepseek-chat', temperature: 1.3};
      case 'translation':
        return {model: 'deepseek-chat', temperature: 1.3};
      case 'creative':
        return {model: 'deepseek-chat', temperature: 1.5};
      default:
        return {model: 'deepseek-chat', temperature: 1.3};
    }
  }

  private getTemperature(useCase: UseCase): number {
    return this.getModelConfig(useCase).temperature;
  }

  async chat(message: string, context?: string, useCase: UseCase = 'conversation'): Promise<AIResponse> {
    try {
      const config = this.getModelConfig(useCase);
      const aiChat = httpsCallable(this.functions, 'aiChat');
      const result = await aiChat({
        message,
        context,
        model: config.model,
        temperature: config.temperature
      });
      return result.data as AIResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async *chatStream(
    message: string, 
    context?: string, 
    useCase: UseCase = 'conversation'
  ): AsyncGenerator<{content: string; done: boolean; error?: string}> {
    try {
      const config = this.getModelConfig(useCase);
      const response = await fetch(`${this.functionsUrl}/aiChatStream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          model: config.model,
          temperature: config.temperature
        })
      });

      if (!response.ok) {
        yield { content: 'Sorry, I encountered an error. Please try again.', done: true };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { content: 'Sorry, I encountered an error. Please try again.', done: true };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (!data.trim()) continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                yield { content: '', done: true, error: parsed.error };
                return;
              }
              
              if (parsed.done) {
                yield { content: '', done: true };
                return;
              }

              if (parsed.content) {
                yield { content: parsed.content, done: false };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('AI chat stream error:', error);
      yield { content: 'Sorry, I encountered an error. Please try again.', done: true };
    }
  }

  async analyzeTask(task: string): Promise<TaskAnalysis> {
    try {
      const analyzeTask = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTask({
        task,
        model: 'deepseek-reasoner', // Use analytical model for task analysis
        temperature: 1.0 // Balanced analytical temperature
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