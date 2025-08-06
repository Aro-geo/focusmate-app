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
      return 'OpenAI API key not configured. Please check your environment variables.';
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
              content: 'You are a helpful productivity assistant for FocusMate AI. Provide concise, actionable advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return 'Sorry, I encountered an error. Please try again later.';
    }
  }

  async chat(message: string, context?: any): Promise<string> {
    return this.generateResponse(message);
  }

  async getFocusSuggestions(tasks: any[]): Promise<string[]> {
    const prompt = `Based on these tasks, provide 3 focus suggestions: ${JSON.stringify(tasks)}`;
    const response = await this.generateResponse(prompt);
    return ['Focus on high-priority tasks first', 'Take regular breaks', 'Eliminate distractions'];
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