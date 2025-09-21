import { PomodoroSession } from './DatabasePomodoroService';

export interface ConversationContext {
  sessionType: 'start' | 'pause' | 'distraction' | 'completion' | 'break' | 'reflection';
  currentTask?: string;
  timeElapsed?: number;
  totalDuration?: number;
  distractionCount?: number;
  previousSessions?: PomodoroSession[];
  userMood?: string;
  timeOfDay?: string;
  streakCount?: number;
  recentPerformance?: {
    completionRate: number;
    averageDistractions: number;
    preferredTimes: string[];
  };
}

export interface AIResponse {
  message: string;
  followUpQuestions?: string[];
  suggestions?: string[];
  insights?: string;
  encouragement?: string;
}

class EnhancedAIFocusCoachService {
  private conversationHistory: Array<{
    timestamp: Date;
    context: ConversationContext;
    userInput?: string;
    aiResponse: string;
  }> = [];
  
  private userProfile: {
    focusPatterns: Record<string, any>;
    commonDistractions: string[];
    bestPerformanceTimes: string[];
    motivationalPreferences: string[];
    personalityInsights: string[];
  } = {
    focusPatterns: {},
    commonDistractions: [],
    bestPerformanceTimes: [],
    motivationalPreferences: [],
    personalityInsights: []
  };

  async generateIntelligentResponse(
    context: ConversationContext,
    userInput?: string
  ): Promise<AIResponse> {
    try {
      // Build conversation context
      const conversationContext = this.buildConversationContext(context, userInput);
      
      // Call Firebase function for AI response
      const response = await this.callAIService(conversationContext);
      
      // Store conversation in history
      this.conversationHistory.push({
        timestamp: new Date(),
        context,
        userInput,
        aiResponse: response.message
      });
      
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(context);
    }
  }

  private buildConversationContext(context: ConversationContext, userInput?: string): string {
    const timeOfDay = this.getTimeOfDay();
  const recentHistory = this.conversationHistory.slice(-10); // Last 10 interactions
    
    let contextPrompt = `You are an intelligent AI Focus Coach helping a user with their Pomodoro session. 

Current Context:
- Session Type: ${context.sessionType}
- Time of Day: ${timeOfDay}
- Current Task: ${context.currentTask || 'Not specified'}
`;

    if (context.timeElapsed && context.totalDuration) {
      const progress = (context.timeElapsed / context.totalDuration) * 100;
      contextPrompt += `- Session Progress: ${Math.round(progress)}% (${Math.round(context.timeElapsed/60)} min of ${Math.round(context.totalDuration/60)} min)\n`;
    }

    if (context.distractionCount !== undefined) {
      contextPrompt += `- Distractions This Session: ${context.distractionCount}\n`;
    }

    if (context.streakCount) {
      contextPrompt += `- Current Streak: ${context.streakCount} days\n`;
    }

    if (context.recentPerformance) {
      contextPrompt += `- Recent Performance: ${Math.round(context.recentPerformance.completionRate * 100)}% completion rate, avg ${context.recentPerformance.averageDistractions} distractions per session\n`;
    }

    // Add user profile insights
    if (this.userProfile.commonDistractions.length > 0) {
      contextPrompt += `- User's Common Distractions: ${this.userProfile.commonDistractions.join(', ')}\n`;
    }

    if (this.userProfile.bestPerformanceTimes.length > 0) {
      contextPrompt += `- User's Best Performance Times: ${this.userProfile.bestPerformanceTimes.join(', ')}\n`;
    }

    // Add recent conversation context
    if (recentHistory.length > 0) {
      contextPrompt += `\nRecent Conversation:\n`;
      recentHistory.forEach((entry, index) => {
        contextPrompt += `${index + 1}. ${entry.context.sessionType}: "${entry.aiResponse}"\n`;
        if (entry.userInput) {
          contextPrompt += `   User: "${entry.userInput}"\n`;
        }
      });
    }

    if (userInput) {
      contextPrompt += `\nUser's Current Input: "${userInput}"\n`;
    }

  contextPrompt += `\nInstructions:
- You are FocusMate AI Coach. Give thorough, actionable guidance.
- Start with a one-line acknowledgement, then provide concrete next steps.
- Include a short plan with 3–6 bullet points, examples, and 1–2 alternatives.
- Briefly explain the “why” behind the advice to build confidence.
- Aim for 150–300 words by default unless the user asks for shorter.
- If chatting during an ongoing session, reference today’s goals and prior messages.

Detail level: comprehensive

Respond as the AI Focus Coach:`;

    return contextPrompt;
  }

  private async callAIService(contextPrompt: string): Promise<AIResponse> {
    try {
      // Call Firebase Cloud Function - use analyzeTask as fallback
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const analyzeTask = httpsCallable(functions, 'analyzeTask');
      
      const result = await analyzeTask({
        task: contextPrompt,
        model: 'deepseek-chat',
        temperature: 0.7
      });

      const data = result.data as { analysis: string };
      
      // Parse the AI response to extract different components
      const aiMessage = data.analysis || 'Let me help you stay focused!';
      
      return this.parseAIResponse(aiMessage);
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw error;
    }
  }

  /**
   * Stream AI response for real-time interaction
   */
  async *generateStreamResponse(
    context: ConversationContext,
    userInput?: string,
    detailLevel: 'concise' | 'balanced' | 'comprehensive' = 'comprehensive'
  ): AsyncGenerator<{ chunk: string; isComplete: boolean; fullResponse?: AIResponse }> {
    const contextPrompt = this.buildConversationContext(context, userInput);
    
    try {
      const response = await fetch(`https://us-central1-focusmate-ai-8cad6.cloudfunctions.net/aiChatStream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contextPrompt,
          context: 'focus_coaching',
          model: 'deepseek-reasoner',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 1200,
          detailLevel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // Stream complete, yield final response
                yield {
                  chunk: '',
                  isComplete: true,
                  fullResponse: this.parseAIResponse(fullContent)
                };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  console.error('Streaming error:', parsed.error);
                  continue;
                }

                // Handle DeepSeek response format through Firebase Functions
                let chunk = '';
                if (parsed.content) {
                  // Direct content from DeepSeek
                  chunk = parsed.content;
                } else if (parsed.response) {
                  // Firebase function response format
                  chunk = parsed.response;
                } else if (typeof parsed === 'string') {
                  // Direct string response
                  chunk = parsed;
                }

                if (chunk) {
                  fullContent += chunk;
                  
                  yield {
                    chunk,
                    isComplete: false
                  };
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('AI coaching stream error:', error);
      yield {
        chunk: 'I apologize, but I\'m having trouble connecting right now. Let me help you with some general focus advice instead.',
        isComplete: true,
        fullResponse: {
          message: 'I apologize, but I\'m having trouble connecting right now. Let me help you with some general focus advice instead.',
          followUpQuestions: ['How are you feeling about your current task?'],
          suggestions: ['Try taking a short break and coming back with fresh perspective.']
        }
      };
    }
  }

  private parseAIResponse(aiMessage: string): AIResponse {
    // Try to extract structured information from the AI response
    const lines = aiMessage.split('\n').filter(line => line.trim());
    
    let message = '';
    const followUpQuestions: string[] = [];
    const suggestions: string[] = [];
    let insights = '';
    let encouragement = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('?')) {
        followUpQuestions.push(trimmedLine);
      } else if (trimmedLine.toLowerCase().includes('suggest') || trimmedLine.toLowerCase().includes('try')) {
        suggestions.push(trimmedLine);
      } else if (trimmedLine.toLowerCase().includes('insight') || trimmedLine.toLowerCase().includes('pattern')) {
        insights = trimmedLine;
      } else if (trimmedLine.toLowerCase().includes('great') || trimmedLine.toLowerCase().includes('excellent') || trimmedLine.toLowerCase().includes('well done')) {
        encouragement = trimmedLine;
      } else {
        message += (message ? ' ' : '') + trimmedLine;
      }
    }

    // If we couldn't parse structure, use the whole message
    if (!message) {
      message = aiMessage;
    }

    return {
      message,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      insights: insights || undefined,
      encouragement: encouragement || undefined
    };
  }

  private getFallbackResponse(context: ConversationContext): AIResponse {
    const fallbackResponses = {
      start: {
        message: "Ready to dive deep into focused work? What's your main goal for this session?",
        followUpQuestions: ["What specific outcome do you want to achieve?", "Any particular challenges you're expecting?"]
      },
      pause: {
        message: "Taking a moment to pause is wise. What pulled your attention away?",
        followUpQuestions: ["Was it an internal thought or external distraction?", "How can we prevent this next time?"]
      },
      distraction: {
        message: "I noticed you got distracted. That's completely normal! What was on your mind?",
        suggestions: ["Try the 2-minute rule: if it takes less than 2 minutes, do it now or write it down for later"]
      },
      completion: {
        message: "Fantastic work completing that session! How do you feel about what you accomplished?",
        followUpQuestions: ["What worked well for your focus?", "What would you do differently next time?"]
      },
      break: {
        message: "Time for a well-deserved break! How was your focus during that session?",
        suggestions: ["Try some light stretching or deep breathing to recharge"]
      },
      reflection: {
        message: "Let's reflect on your focus journey. What patterns are you noticing in your work?",
        followUpQuestions: ["When do you feel most focused?", "What environments help you concentrate best?"]
      }
    };

    return fallbackResponses[context.sessionType] || {
      message: "I'm here to help you stay focused. How are you feeling about your current session?"
    };
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  async updateUserProfile(sessionData: {
    completed: boolean;
    distractions: string[];
    timeOfDay: string;
    duration: number;
    taskType?: string;
  }): Promise<void> {
    // Update user's focus patterns
    if (sessionData.completed) {
      if (!this.userProfile.bestPerformanceTimes.includes(sessionData.timeOfDay)) {
        this.userProfile.bestPerformanceTimes.push(sessionData.timeOfDay);
      }
    }

    // Track common distractions
    sessionData.distractions.forEach(distraction => {
      if (!this.userProfile.commonDistractions.includes(distraction)) {
        this.userProfile.commonDistractions.push(distraction);
      }
    });

    // Store updated profile (in a real app, this would go to a database)
    localStorage.setItem('aiCoachUserProfile', JSON.stringify(this.userProfile));
  }

  async loadUserProfile(userId: string): Promise<void> {
    try {
      // Load from localStorage for now (in production, load from database)
      const stored = localStorage.getItem('aiCoachUserProfile');
      if (stored) {
        this.userProfile = JSON.parse(stored);
      }

      // Load conversation history
      const historyStored = localStorage.getItem('aiCoachHistory');
      if (historyStored) {
        this.conversationHistory = JSON.parse(historyStored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  getConversationHistory(): Array<{
    timestamp: Date;
    context: ConversationContext;
    userInput?: string;
    aiResponse: string;
  }> {
    return this.conversationHistory;
  }

  async generateSessionInsights(sessions: PomodoroSession[]): Promise<string[]> {
    if (sessions.length === 0) return [];

    const insights: string[] = [];
    
    // Analyze completion patterns
    const completionRate = sessions.filter(s => s.completed).length / sessions.length;
    if (completionRate > 0.8) {
      insights.push("You have excellent session completion discipline! Keep up the consistent focus.");
    } else if (completionRate < 0.5) {
      insights.push("I notice you're stopping sessions early often. Let's explore what's breaking your focus.");
    }

    // Analyze time patterns
    const timePatterns = sessions.reduce((acc, session) => {
      const hour = session.startTime.getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      acc[timeSlot] = (acc[timeSlot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bestTime = Object.entries(timePatterns).sort(([,a], [,b]) => b - a)[0];
    if (bestTime) {
      insights.push(`Your most productive time appears to be ${bestTime[0]}. Consider scheduling important tasks then.`);
    }

    return insights;
  }
}

export const enhancedAIFocusCoachService = new EnhancedAIFocusCoachService();