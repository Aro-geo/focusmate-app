export interface AIResponse {
  summary: string;
  suggestions?: string[];
  insights?: string[];
}

class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found in environment variables');
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.apiKey) {
      return 'Hi! I\'m your productivity assistant. While OpenAI integration is being configured, here are some quick tips: Take regular breaks, prioritize your most important tasks, and stay hydrated!';
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful productivity assistant for FocusMate AI. Provide concise, actionable advice in 1-2 sentences.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        return this.getFallbackResponse(prompt);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.getFallbackResponse(prompt);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(prompt);
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
    return this.generateResponse(message);
  }

  async getFocusSuggestions(tasks: any[]): Promise<string[]> {
    if (tasks.length === 0) {
      return ['Start by adding some tasks to your list', 'Set clear goals for today', 'Take time to plan your priorities'];
    }
    
    const prompt = `I have ${tasks.length} tasks. Give me 3 focus tips.`;
    const response = await this.generateResponse(prompt);
    
    // Fallback suggestions
    const fallbackSuggestions = [
      'Focus on high-priority tasks first',
      'Use the Pomodoro technique for better focus',
      'Eliminate distractions from your workspace',
      'Take regular breaks to maintain productivity',
      'Break complex tasks into smaller steps'
    ];
    
    return [response, ...fallbackSuggestions.slice(0, 2)];
  }

  async generateSessionSummary(sessionData: {
    duration: number;
    task: string;
    mood: string;
    mode: string;
  }): Promise<AIResponse> {
    const prompt = `Analyze this focus session: Duration: ${sessionData.duration}min, Task: ${sessionData.task}, Mood: ${sessionData.mood}, Mode: ${sessionData.mode}. Provide insights and suggestions.`;
    
    const response = await this.generateResponse(prompt);
    
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
    const prompt = `Analyze this task: "${taskDescription}". Provide:
    1. Complexity score (1-10)
    2. Estimated duration in minutes
    3. 2-3 actionable suggestions`;

    const response = await this.generateResponse(prompt);
    
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

const openAIService = new OpenAIService();
export { openAIService };
export default openAIService;