import BaseApiService from './BaseApiService';

// Enhanced AI Service with advanced productivity insights
interface EnhancedAIResponse {
  insights: string[];
  suggestions: string[];
  priority_score?: number;
  estimated_time?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  focus_tips?: string[];
  break_recommendations?: string[];
  mood_impact?: string;
  productivity_prediction?: number;
}

interface TaskAnalysis {
  complexity: number;
  estimated_duration: number;
  suggested_approach: string[];
  optimal_time_slots: string[];
  required_focus_level: 'low' | 'medium' | 'high';
  subtasks?: string[];
}

interface ProductivityPattern {
  peak_hours: string[];
  energy_levels: Record<string, number>;
  focus_duration_trends: number[];
  break_preferences: string[];
  productivity_score: number;
}

interface ContextualInsight {
  current_context: string;
  recommendations: string[];
  warnings?: string[];
  optimization_tips: string[];
}

class EnhancedAIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
  }

  /**
   * Advanced Task Analysis with AI
   * Analyzes task complexity, duration, and optimal approach
   */
  async analyzeTask(taskDescription: string, userContext?: any): Promise<TaskAnalysis> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an advanced productivity AI that analyzes tasks to provide optimal execution strategies. 
          Analyze the given task and respond with a JSON object containing:
          - complexity (1-10 scale)
          - estimated_duration (in minutes)
          - suggested_approach (array of step-by-step approaches)
          - optimal_time_slots (array of recommended times like "morning", "afternoon", "evening")
          - required_focus_level ("low", "medium", "high")
          - subtasks (array of smaller tasks if the main task is complex)`
        },
        {
          role: 'user',
          content: `Analyze this task: "${taskDescription}"
          ${userContext ? `User context: ${JSON.stringify(userContext)}` : ''}`
        }
      ];

      const response = await BaseApiService.post<{success: boolean, data: any}>('ai/analyze-task', {
        messages,
        taskDescription,
        userContext
      });

      if (response.success && response.data) {
        return response.data as TaskAnalysis;
      }

      // Fallback analysis
      return this.generateFallbackTaskAnalysis(taskDescription);
    } catch (error) {
      console.error('Task analysis error:', error);
      return this.generateFallbackTaskAnalysis(taskDescription);
    }
  }

  /**
   * Intelligent Task Prioritization
   * Uses AI to suggest task order based on energy, deadlines, and dependencies
   */
  async prioritizeTasks(tasks: any[], userState: any): Promise<any[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a task prioritization expert. Analyze the given tasks and user state to suggest optimal order.
          Consider: urgency, importance, user energy levels, dependencies, and optimal timing.
          Return the tasks reordered with priority scores and reasoning.`
        },
        {
          role: 'user',
          content: `Tasks: ${JSON.stringify(tasks)}
          User State: ${JSON.stringify(userState)}
          
          Please reorder these tasks with priority scores (1-10) and brief reasoning for each.`
        }
      ];

      const response = await BaseApiService.post<{success: boolean, data: any}>('ai/prioritize-tasks', {
        messages,
        tasks,
        userState
      });

      if (response.success && response.data) {
        return response.data.data || response.data;
      }

      // Fallback prioritization
      return this.generateFallbackPrioritization(tasks);
    } catch (error) {
      console.error('Task prioritization error:', error);
      return this.generateFallbackPrioritization(tasks);
    }
  }

  /**
   * Context-Aware Productivity Insights
   * Provides insights based on current context, time, mood, and history
   */
  async getContextualInsights(context: {
    currentTime: string;
    userMood: string;
    recentActivity: string[];
    upcomingTasks: any[];
    productivityHistory: any[];
  }): Promise<ContextualInsight> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a productivity coach that provides context-aware insights.
          Analyze the user's current context and provide personalized recommendations.
          Consider time of day, mood, recent activity patterns, and upcoming tasks.`
        },
        {
          role: 'user',
          content: `Current Context: ${JSON.stringify(context)}
          
          Provide insights and recommendations for optimal productivity right now.`
        }
      ];

      const response = await BaseApiService.post<{success: boolean, data: ContextualInsight}>('ai/contextual-insights', {
        messages,
        context
      });

      if (response.success && response.data) {
        return response.data.data || response.data;
      }

      return this.generateFallbackInsights(context);
    } catch (error) {
      console.error('Contextual insights error:', error);
      return this.generateFallbackInsights(context);
    }
  }

  /**
   * Smart Scheduling Recommendations
   * AI-powered scheduling based on task requirements and user patterns
   */
  async getSchedulingRecommendations(
    tasks: any[], 
    availableTimeSlots: string[], 
    userPreferences: any,
    productivityPatterns: ProductivityPattern
  ): Promise<any[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a smart scheduling AI. Create optimal schedules based on:
          - Task requirements (complexity, focus level, estimated duration)
          - User's productivity patterns and peak hours
          - Available time slots
          - User preferences
          
          Return a schedule with reasoning for each time slot assignment.`
        },
        {
          role: 'user',
          content: `
          Tasks: ${JSON.stringify(tasks)}
          Available Time Slots: ${JSON.stringify(availableTimeSlots)}
          User Preferences: ${JSON.stringify(userPreferences)}
          Productivity Patterns: ${JSON.stringify(productivityPatterns)}
          
          Create an optimal schedule for today.`
        }
      ];

      const response = await BaseApiService.post<{success: boolean, data: any}>('ai/schedule-recommendations', {
        messages,
        tasks,
        availableTimeSlots,
        userPreferences,
        productivityPatterns
      });

      if (response.success && response.data) {
        return response.data;
      }

      return this.generateFallbackSchedule(tasks, availableTimeSlots);
    } catch (error) {
      console.error('Scheduling recommendations error:', error);
      return this.generateFallbackSchedule(tasks, availableTimeSlots);
    }
  }

  /**
   * Productivity Pattern Analysis
   * Analyze user behavior to identify patterns and optimization opportunities
   */
  async analyzeProductivityPatterns(userData: {
    sessions: any[];
    tasks: any[];
    mood_logs: any[];
    timeframe: string;
  }): Promise<ProductivityPattern> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a productivity analytics AI. Analyze user data to identify patterns:
          - Peak productivity hours
          - Energy level patterns throughout the day
          - Focus duration trends
          - Break preferences and effectiveness
          - Overall productivity score
          
          Return insights that can help optimize future productivity.`
        },
        {
          role: 'user',
          content: `User Data: ${JSON.stringify(userData)}
          
          Analyze this data to identify productivity patterns and optimization opportunities.`
        }
      ];

      const response = await BaseApiService.post<{success: boolean, data: ProductivityPattern}>('ai/analyze-patterns', {
        messages,
        userData
      });

      if (response.success && response.data) {
        return response.data;
      }

      return this.generateFallbackPatterns();
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return this.generateFallbackPatterns();
    }
  }

  /**
   * Intelligent Break Suggestions
   * AI-powered break recommendations based on current state and productivity science
   */
  async getIntelligentBreakSuggestions(currentState: {
    session_duration: number;
    task_type: string;
    energy_level: number;
    focus_quality: number;
    next_task?: string;
  }): Promise<{
    break_type: string;
    duration: number;
    activities: string[];
    timing_reason: string;
  }> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a break optimization AI based on productivity science and cognitive research.
          Recommend optimal break types, durations, and activities based on:
          - Current session state
          - Cognitive load and fatigue indicators
          - Upcoming task requirements
          - Evidence-based recovery strategies`
        },
        {
          role: 'user',
          content: `Current State: ${JSON.stringify(currentState)}
          
          Recommend the optimal break strategy right now.`
        }
      ];

      const response = await BaseApiService.post<{success: boolean, data: any}>('ai/break-suggestions', {
        messages,
        currentState
      });

      if (response.success && response.data) {
        return response.data;
      }

      return this.generateFallbackBreakSuggestion(currentState);
    } catch (error) {
      console.error('Break suggestions error:', error);
      return this.generateFallbackBreakSuggestion(currentState);
    }
  }

  // Fallback methods for when AI services are unavailable
  private generateFallbackTaskAnalysis(taskDescription: string): TaskAnalysis {
    const words = taskDescription.split(' ').length;
    const complexity = Math.min(Math.max(Math.floor(words / 3), 1), 10);
    
    return {
      complexity,
      estimated_duration: complexity * 15,
      suggested_approach: [
        "Break the task into smaller steps",
        "Set up your workspace for minimal distractions",
        "Start with the most challenging part while energy is high"
      ],
      optimal_time_slots: complexity > 7 ? ["morning"] : ["morning", "afternoon"],
      required_focus_level: complexity > 7 ? "high" : complexity > 4 ? "medium" : "low"
    };
  }

  private generateFallbackPrioritization(tasks: any[]): any[] {
    return tasks.map((task, index) => ({
      ...task,
      priority_score: 10 - index,
      reasoning: "Standard priority ordering"
    }));
  }

  private generateFallbackInsights(context: any): ContextualInsight {
    const currentHour = new Date().getHours();
    let timeBasedTip = "";
    
    if (currentHour < 10) {
      timeBasedTip = "Morning energy is typically high - tackle complex tasks now";
    } else if (currentHour < 14) {
      timeBasedTip = "Mid-day focus can vary - consider your energy levels";
    } else if (currentHour < 17) {
      timeBasedTip = "Afternoon dip is common - try lighter tasks or take a break";
    } else {
      timeBasedTip = "Evening hours can be good for planning and lighter work";
    }

    return {
      current_context: "General productivity mode",
      recommendations: [
        timeBasedTip,
        "Take regular breaks to maintain focus",
        "Prioritize your most important task first"
      ],
      optimization_tips: [
        "Use the Pomodoro technique for sustained focus",
        "Keep your workspace organized",
        "Stay hydrated and maintain good posture"
      ]
    };
  }

  private generateFallbackSchedule(tasks: any[], timeSlots: string[]): any[] {
    return tasks.slice(0, timeSlots.length).map((task, index) => ({
      task,
      timeSlot: timeSlots[index],
      reasoning: "Scheduled in order of priority"
    }));
  }

  private generateFallbackPatterns(): ProductivityPattern {
    return {
      peak_hours: ["09:00", "10:00", "14:00", "15:00"],
      energy_levels: {
        "morning": 8,
        "afternoon": 6,
        "evening": 4
      },
      focus_duration_trends: [25, 30, 25, 20],
      break_preferences: ["short walk", "stretch", "hydration"],
      productivity_score: 7.5
    };
  }

  private generateFallbackBreakSuggestion(currentState: any): any {
    if (currentState.session_duration > 45) {
      return {
        break_type: "Active Recovery",
        duration: 15,
        activities: ["Walk around", "Stretch", "Deep breathing"],
        timing_reason: "Long session requires active recovery"
      };
    } else if (currentState.energy_level < 5) {
      return {
        break_type: "Energy Boost",
        duration: 10,
        activities: ["Hydrate", "Light snack", "Fresh air"],
        timing_reason: "Low energy detected"
      };
    } else {
      return {
        break_type: "Quick Reset",
        duration: 5,
        activities: ["Deep breathing", "Eye rest", "Posture check"],
        timing_reason: "Maintenance break for sustained focus"
      };
    }
  }
}

export const enhancedAIService = new EnhancedAIService();
export default EnhancedAIService;
