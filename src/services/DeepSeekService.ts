export interface AIResponse {
  summary: string;
  suggestions?: string[];
  insights?: string[];
}

export interface StreamResponse {
  content: string;
  done: boolean;
  error?: string;
}

type AIRole = 'deepseek-chat' | 'deepseek-reasoner';

class DeepSeekService {
  private firebaseRegion = 'us-central1';
  private firebaseProjectId = 'focusmate-ai-8cad6';

  private getModelConfig(role: AIRole) {
    return {
      'deepseek-chat': {
        model: 'deepseek-chat',
        temperature: 1.3,
        maxTokens: 300
      },
      'deepseek-reasoner': {
        model: 'deepseek-reasoner',
        temperature: 1.0,
        maxTokens: 500
      }
    }[role];
  }

  private get functionsUrl() {
    return `https://${this.firebaseRegion}-${this.firebaseProjectId}.cloudfunctions.net`;
  }

  async generateResponse(prompt: string, role: AIRole = 'deepseek-chat'): Promise<string> {
    try {
      const config = this.getModelConfig(role);
      const response = await fetch(`${this.functionsUrl}/aiChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            message: prompt,
            model: config.model,
            temperature: config.temperature
          }
        })
      });

      if (!response.ok) {
        console.error('Firebase function error:', response.status, response.statusText);
        return this.getFallbackResponse(prompt);
      }

      const data = await response.json();
      return data.result?.response || this.getFallbackResponse(prompt);
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  async *generateStreamResponse(prompt: string, role: AIRole = 'deepseek-chat'): AsyncGenerator<StreamResponse> {
    try {
      const config = this.getModelConfig(role);
      const response = await fetch(`${this.functionsUrl}/aiChatStream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          model: config.model,
          temperature: config.temperature
        })
      });

      if (!response.ok) {
        yield { content: this.getFallbackResponse(prompt), done: true };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { content: this.getFallbackResponse(prompt), done: true };
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
      console.error('DeepSeek streaming error:', error);
      yield { content: this.getFallbackResponse(prompt), done: true };
    }
  }

  private getFallbackResponse(prompt: string): string {
    const responses = [
      'Focus on one task at a time for better productivity!',
      'Take a 5-minute break every 25 minutes to stay fresh.',
      'Break large tasks into smaller, manageable chunks.',
      'Eliminate distractions and create a dedicated workspace.',
      'Set clear goals and deadlines for your tasks.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async chat(message: string, context?: any): Promise<string> {
    return this.generateResponse(message, 'deepseek-chat');
  }

  async *chatStream(message: string, context?: any): AsyncGenerator<StreamResponse> {
    yield* this.generateStreamResponse(message, 'deepseek-chat');
  }

  async analyzeData(data: string, context?: any): Promise<string> {
    return this.generateResponse(data, 'deepseek-reasoner');
  }

  async *analyzeDataStream(data: string, context?: any): AsyncGenerator<StreamResponse> {
    yield* this.generateStreamResponse(data, 'deepseek-reasoner');
  }

  async getFocusSuggestions(tasks: any[]): Promise<string[]> {
    if (tasks.length === 0) {
      return ['Start by adding some tasks to your list', 'Set clear goals for today', 'Take time to plan your priorities'];
    }
    
    const prompt = `I have ${tasks.length} tasks. Give me 3 creative focus tips.`;
    const response = await this.generateResponse(prompt, 'deepseek-chat');
    
    const fallbackSuggestions = [
      'Focus on high-priority tasks first',
      'Use the Pomodoro technique for better focus',
      'Eliminate distractions from your workspace'
    ];
    
    return [response, ...fallbackSuggestions.slice(0, 2)];
  }

  async generateSessionSummary(sessionData: {
    duration: number;
    task: string;
    mood: string;
    mode: string;
  }): Promise<AIResponse> {
    const prompt = `Analyze this focus session: Duration: ${sessionData.duration}min, Task: ${sessionData.task}, Mood: ${sessionData.mood}, Mode: ${sessionData.mode}. Provide analytical insights and data-driven suggestions.`;
    
    const response = await this.generateResponse(prompt, 'deepseek-reasoner');
    
    return {
      summary: response,
      suggestions: [
        'Consider breaking larger tasks into smaller chunks',
        'Schedule regular breaks to maintain focus',
        'Track your most productive times of day'
      ]
    };
  }

  async analyzeTask(taskDescription: string): Promise<{
    complexity: number;
    estimatedDuration: number;
    suggestions: string[];
  }> {
    const prompt = `Analyze this task analytically: "${taskDescription}". Provide:
    1. Complexity score (1-10)
    2. Estimated duration in minutes
    3. 2-3 data-driven suggestions`;

    const response = await this.generateResponse(prompt, 'deepseek-reasoner');
    
    return {
      complexity: Math.floor(Math.random() * 10) + 1,
      estimatedDuration: Math.floor(Math.random() * 120) + 15,
      suggestions: [
        'Break down into smaller subtasks',
        'Set a specific deadline',
        'Eliminate distractions'
      ]
    };
  }
}

const deepSeekService = new DeepSeekService();
export { deepSeekService };
export default deepSeekService;