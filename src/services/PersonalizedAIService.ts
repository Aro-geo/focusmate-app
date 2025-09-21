import { SecurityUtils } from '../utils/security';
import { httpsCallable, getFunctions } from 'firebase/functions';

interface UserHabits {
  userId: string;
  completedTasks: number;
  focusTime: number;
  averageSessionLength: number;
  productiveHours: number[];
  taskCompletionRate: number;
  preferredBreakLength: number;
}

interface TaskAnalysis {
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  deadline?: Date;
  subtasks: string[];
  tags: string[];
}

interface ProductivityRecommendation {
  type: 'work_interval' | 'break_interval' | 'task_priority' | 'daily_routine';
  title: string;
  description: string;
  actionable: string;
  confidence: number;
}

class PersonalizedAIService {
  private functions = getFunctions();

  async analyzeUserHabits(userId: string, tasks: any[], sessions: any[]): Promise<UserHabits> {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalFocusTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgSessionLength = sessions.length > 0 ? totalFocusTime / sessions.length : 25;
    
    return {
      userId,
      completedTasks,
      focusTime: totalFocusTime,
      averageSessionLength: avgSessionLength,
      productiveHours: this.extractProductiveHours(sessions),
      taskCompletionRate: tasks.length > 0 ? completedTasks / tasks.length : 0,
      preferredBreakLength: Math.round(avgSessionLength * 0.2)
    };
  }

  async generateProductivityRecommendations(habits: UserHabits): Promise<ProductivityRecommendation[]> {
    const recommendations: ProductivityRecommendation[] = [];

    // Work interval recommendation
    if (habits.averageSessionLength < 20) {
      recommendations.push({
        type: 'work_interval',
        title: 'Extend Your Focus Sessions',
        description: `Your average focus time is ${Math.round(habits.averageSessionLength)} minutes. Research shows 25-45 minute sessions are optimal.`,
        actionable: 'Try gradually increasing your Pomodoro sessions to 25 minutes.',
        confidence: 0.85
      });
    }

    // Break interval recommendation
    recommendations.push({
      type: 'break_interval',
      title: 'Optimize Your Breaks',
      description: `Based on your ${Math.round(habits.averageSessionLength)}-minute focus sessions, ${habits.preferredBreakLength}-minute breaks would be ideal.`,
      actionable: `Take ${habits.preferredBreakLength}-minute breaks between focus sessions.`,
      confidence: 0.9
    });

    // Task priority recommendation
    if (habits.taskCompletionRate < 0.7) {
      recommendations.push({
        type: 'task_priority',
        title: 'Improve Task Completion',
        description: `Your completion rate is ${Math.round(habits.taskCompletionRate * 100)}%. Focus on fewer, high-impact tasks.`,
        actionable: 'Limit yourself to 3-5 priority tasks per day.',
        confidence: 0.8
      });
    }

    // Daily routine recommendation
    if (habits.productiveHours.length > 0) {
      const bestHour = habits.productiveHours[0];
      recommendations.push({
        type: 'daily_routine',
        title: 'Optimize Your Schedule',
        description: `You're most productive around ${bestHour}:00. Schedule important tasks during this time.`,
        actionable: `Block ${bestHour}:00-${bestHour + 2}:00 for your most challenging work.`,
        confidence: 0.75
      });
    }

    return recommendations;
  }

  async analyzeTaskFromNaturalLanguage(input: string): Promise<TaskAnalysis> {
    console.log('🔍 PersonalizedAIService: Analyzing task:', input);
    
    try {
      console.log('🚀 PersonalizedAIService: Calling Firebase analyzeTask function...');
      
      const analyzeTaskFunction = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTaskFunction({
        task: input,
        model: 'deepseek-reasoner',
        temperature: 0.7
      });

      console.log('✅ PersonalizedAIService: Firebase function response:', result);

      const response = result.data as any;
      console.log('🔎 PersonalizedAIService: Response data keys:', Object.keys(response || {}));
      console.log('🔎 PersonalizedAIService: Full response data:', response);
      
      if (!response) {
        console.error('❌ PersonalizedAIService: No response data received');
        throw new Error('No response data from analyzeTask function');
      }

      console.log('📝 PersonalizedAIService: Raw AI analysis:', response.analysis);
      
      // The analyzeTask function now returns structured data
      console.log('✨ PersonalizedAIService: Structured response:', response);

      return {
        category: response.category || 'General',
        priority: response.priority || 'medium',
        estimatedDuration: response.estimatedTime || 30,
        deadline: undefined, // analyzeTask doesn't handle deadlines yet
        subtasks: response.suggestions || [],
        tags: ['ai-analyzed']
      };
    } catch (error) {
      console.error('❌ PersonalizedAIService: Task analysis error:', SecurityUtils.sanitizeForLog(String(error)));
      console.log('🔄 PersonalizedAIService: Falling back to rule-based analysis');
      return this.fallbackTaskAnalysis(input);
    }
  }

  async generateSessionSummary(sessionData: {
    duration: number;
    tasksCompleted: string[];
    mood: string;
    notes?: string;
  }): Promise<string> {
    try {
      const taskDescription = `Generate a brief, encouraging summary for this focus session:
      Duration: ${sessionData.duration} minutes
      Tasks completed: ${sessionData.tasksCompleted.join(', ')}
      Mood: ${sessionData.mood}
      Notes: ${sessionData.notes || 'None'}
      
      Provide insights and encouragement in 2-3 sentences.`;

      const analyzeTaskFunction = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTaskFunction({
        task: taskDescription,
        model: 'deepseek-chat',
        temperature: 1.3
      });

      const response = result.data as any;
      if (!response || !response.analysis) {
        throw new Error('Invalid response from analyzeTask function');
      }

      return response.analysis;
    } catch (error) {
      console.error('Summary generation error:', SecurityUtils.sanitizeForLog(String(error)));
      return this.fallbackSessionSummary(sessionData);
    }
  }

  async generateJournalInsights(entry: string): Promise<string> {
    try {
      const taskDescription = `Analyze this journal entry and provide helpful insights:
      "${entry}"
      
      Highlight key achievements, patterns, and suggest areas for improvement. Be supportive and constructive.`;

      const analyzeTaskFunction = httpsCallable(this.functions, 'analyzeTask');
      const result = await analyzeTaskFunction({
        task: taskDescription,
        model: 'deepseek-chat',
        temperature: 1.3
      });

      const response = result.data as any;
      if (!response || !response.analysis) {
        throw new Error('Invalid response from analyzeTask function');
      }

      return response.analysis;
    } catch (error) {
      console.error('Journal insights error:', SecurityUtils.sanitizeForLog(String(error)));
      return "Great reflection! Keep journaling to track your progress and maintain self-awareness.";
    }
  }

  private extractProductiveHours(sessions: any[]): number[] {
    const hourCounts: { [hour: number]: number } = {};
    
    sessions.forEach(session => {
      if (session.startTime) {
        const hour = new Date(session.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private fallbackTaskAnalysis(input: string): TaskAnalysis {
    console.log('⚠️ PersonalizedAIService: Using fallback rule-based analysis (AI failed)');
    
    const hasDeadline = /by|due|before|until/i.test(input);
    const isUrgent = /urgent|asap|immediately|today/i.test(input);
    const isProject = /project|report|presentation/i.test(input);

    return {
      category: isProject ? 'Project' : 'Task',
      priority: isUrgent ? 'high' : hasDeadline ? 'medium' : 'low',
      estimatedDuration: isProject ? 120 : 30,
      deadline: hasDeadline ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      subtasks: isProject ? ['Research', 'Draft', 'Review', 'Finalize'] : ['Complete task'],
      tags: ['fallback-analysis', isUrgent ? 'urgent' : 'normal']
    };
  }

  private fallbackSessionSummary(sessionData: any): string {
    const duration = sessionData.duration;
    const tasksCount = sessionData.tasksCompleted.length;
    
    if (duration >= 25 && tasksCount > 0) {
      return `Excellent ${duration}-minute focus session! You completed ${tasksCount} task${tasksCount > 1 ? 's' : ''} and maintained good concentration. Keep up this productive momentum!`;
    } else if (duration < 25) {
      return `Good start with your ${duration}-minute session! Try extending your next session to 25 minutes for optimal focus benefits.`;
    } else {
      return `Great ${duration}-minute focus session! Even without completing specific tasks, dedicated focus time builds your concentration muscle.`;
    }
  }
}

export default new PersonalizedAIService();