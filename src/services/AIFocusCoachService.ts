import { firebaseService } from './FirebaseService';
import { PomodoroSession } from './DatabasePomodoroService';

interface FocusInsight {
  id: string;
  type: 'pattern' | 'suggestion' | 'achievement' | 'challenge';
  title: string;
  description: string;
  actionText?: string;
  actionCallback?: () => void;
  metrics?: Record<string, string | number>;
  timestamp: Date;
}

interface DistractionPattern {
  frequency: number;
  timePattern?: string;
  type?: string;
}

interface FocusAnalytics {
  averageSessionLength: number;
  completionRate: number;
  optimalTime: string;
  commonDistraction?: string;
  streak: number;
  totalFocusHours: number;
  bestDayOfWeek?: string;
}

class AIFocusCoachService {
  private sessionHistory: PomodoroSession[] = [];
  private distractions: Record<string, DistractionPattern> = {};
  private analytics: FocusAnalytics = {
    averageSessionLength: 25,
    completionRate: 0,
    optimalTime: '9:00 AM',
    streak: 0,
    totalFocusHours: 0
  };
  
  async loadUserData(userId: string): Promise<void> {
    try {
      // Load past sessions
      this.sessionHistory = await firebaseService.getPomodoroSessions() || [];
      
      // Calculate analytics
      this.calculateAnalytics();
    } catch (error) {
      // Error loading focus coach data
      this.sessionHistory = []; // Initialize with empty array on error
    }
  }
  
  getAnalytics(): FocusAnalytics {
    return this.analytics;
  }
  
  private calculateAnalytics(): void {
    if (this.sessionHistory.length === 0) return;
    
    // Calculate completion rate
    const completed = this.sessionHistory.filter(s => s.completed).length;
    this.analytics.completionRate = completed / this.sessionHistory.length;
    
    // Calculate average session length
    const totalMinutes = this.sessionHistory.reduce((acc, session) => {
      return acc + (session.completed ? session.durationMinutes : 0);
    }, 0);
    this.analytics.averageSessionLength = totalMinutes / completed;
    
    // Calculate total focus hours
    this.analytics.totalFocusHours = totalMinutes / 60;
    
    // Find optimal time (simplified)
    const successfulSessions = this.sessionHistory.filter(s => s.completed);
    const hours = successfulSessions.map(s => s.startTime.getHours());
    const mostCommonHour = this.getMostFrequent(hours);
    this.analytics.optimalTime = `${mostCommonHour}:00 ${mostCommonHour >= 12 ? 'PM' : 'AM'}`;
    
    // Calculate streak (simplified)
    this.calculateStreak();
    
    // Find best day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysOfWeek = successfulSessions.map(s => s.startTime.getDay());
    const mostCommonDay = this.getMostFrequent(daysOfWeek);
    this.analytics.bestDayOfWeek = days[mostCommonDay];
  }
  
  private calculateStreak(): void {
    // Simplified streak calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    const date = new Date(today);
    
    while (true) {
      // Check if there's a completed session for this date
      const hasSession = this.sessionHistory.some(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return session.completed && sessionDate.getTime() === date.getTime();
      });
      
      if (!hasSession) break;
      
      currentStreak++;
      date.setDate(date.getDate() - 1);
    }
    
    this.analytics.streak = currentStreak;
  }
  
  private getMostFrequent(arr: number[]): number {
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    let mostFrequent = arr[0];
    
    for (const item of arr) {
      frequency[item] = (frequency[item] || 0) + 1;
      if (frequency[item] > maxFreq) {
        maxFreq = frequency[item];
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }
  
  trackDistraction(distractionType: string): void {
    if (!this.distractions[distractionType]) {
      this.distractions[distractionType] = { frequency: 0 };
    }
    
    this.distractions[distractionType].frequency++;
    
    // Record time pattern (morning, afternoon, evening)
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    if (hour >= 17) timeOfDay = 'evening';
    
    this.distractions[distractionType].timePattern = timeOfDay;
  }
  
  trackCompletedSession(sessionData: { 
    duration: number; 
    distractions: number; 
    notes: string; 
    taskName?: string;
  }): void {
    // In a real implementation, this would update user data
    // For now, we'll just log it
    // Session completed successfully
    
    // Update analytics
    const { duration } = sessionData;
    this.analytics.totalFocusHours += duration / 60;
    
    // Increase streak (simplified implementation)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastSession = this.sessionHistory[this.sessionHistory.length - 1];
    if (lastSession) {
      const lastSessionDate = new Date(lastSession.startTime);
      lastSessionDate.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastSessionDate.getTime() === yesterday.getTime()) {
        this.analytics.streak++;
      }
    } else {
      this.analytics.streak = 1;
    }
  }
  
  getDistractionsInsight(): FocusInsight | null {
    if (Object.keys(this.distractions).length === 0) return null;
    
    // Find most common distraction
    let mostCommonDistraction = '';
    let highestFrequency = 0;
    let timePattern = '';
    
    for (const [type, data] of Object.entries(this.distractions)) {
      if (data.frequency > highestFrequency) {
        highestFrequency = data.frequency;
        mostCommonDistraction = type;
        timePattern = data.timePattern || '';
      }
    }
    
    if (highestFrequency >= 3) {
      return {
        id: 'distraction-pattern',
        type: 'pattern',
        title: 'Distraction Pattern Detected',
        description: `You're most frequently distracted by "${mostCommonDistraction}", especially in the ${timePattern}.`,
        actionText: 'Try Distraction Shield',
        metrics: { 
          'Frequency': highestFrequency, 
          'Time': timePattern 
        },
        timestamp: new Date()
      };
    }
    
    return null;
  }
  
  getSessionSuggestion(currentTimeOfDay: string, currentDuration: number): FocusInsight {
    // If user has history, recommend optimal session length and time
    if (this.sessionHistory.length > 0) {
      if (Math.abs(this.analytics.averageSessionLength - currentDuration) > 5) {
        return {
          id: 'session-length',
          type: 'suggestion',
          title: 'Optimize Your Session Length',
          description: `Your most productive sessions last about ${Math.round(this.analytics.averageSessionLength)} minutes. Consider adjusting your timer.`,
          actionText: 'Adjust Timer',
          metrics: { 'Optimal': `${Math.round(this.analytics.averageSessionLength)}m` },
          timestamp: new Date()
        };
      }
    }
    
    // Default suggestions based on time of day
    const timeBasedSuggestions: Record<string, FocusInsight> = {
      morning: {
        id: 'morning-focus',
        type: 'suggestion',
        title: 'Morning Focus Boost',
        description: 'Your brain is most alert in the morning. Consider tackling your most challenging tasks now.',
        actionText: 'Start Deep Work',
        timestamp: new Date()
      },
      afternoon: {
        id: 'afternoon-slump',
        type: 'suggestion',
        title: 'Beat the Afternoon Slump',
        description: 'Try a shorter session (15-20 min) with more frequent breaks to maintain focus during the afternoon.',
        actionText: 'Try 20min Timer',
        metrics: { 'Recommended': '20m' },
        timestamp: new Date()
      },
      evening: {
        id: 'evening-wind-down',
        type: 'suggestion',
        title: 'Evening Wind-Down',
        description: 'Consider lighter tasks in the evening. Your analytical abilities decrease, but creativity may peak.',
        actionText: 'Switch to Creative',
        timestamp: new Date()
      }
    };
    
    return timeBasedSuggestions[currentTimeOfDay as keyof typeof timeBasedSuggestions];
  }
  
  getMotivationalChallenge(completedToday: number, streak: number): FocusInsight | null {
    // Only suggest challenges when they make sense
    if (completedToday === 0) {
      return {
        id: 'first-session',
        type: 'challenge',
        title: 'Start Your Focus Journey',
        description: 'Complete your first Pomodoro session of the day to build momentum.',
        actionText: 'Start Now',
        timestamp: new Date()
      };
    }
    
    if (completedToday === 3) {
      return {
        id: 'four-pomodoro',
        type: 'challenge',
        title: 'Four Session Challenge',
        description: 'You\'ve completed 3 sessions! Complete one more to reach the recommended daily goal.',
        actionText: 'One More Session',
        metrics: { 'Progress': '3/4' },
        timestamp: new Date()
      };
    }
    
    if (streak > 0) {
      return {
        id: 'streak-keeper',
        type: 'challenge',
        title: `${streak} Day Streak!`,
        description: `You're on a ${streak} day focus streak. Keep it going today!`,
        actionText: 'Maintain Streak',
        metrics: { 'Streak': streak },
        timestamp: new Date()
      };
    }
    
    return null;
  }
  
  getAchievementInsight(sessionsCompleted: number): FocusInsight | null {
    const achievements = [
      { threshold: 1, title: 'First Focus!', description: 'You completed your first focus session. Great start!' },
      { threshold: 5, title: 'Focus Initiate', description: 'You\'ve completed 5 focus sessions. You\'re building momentum!' },
      { threshold: 10, title: 'Focus Apprentice', description: 'Double digits! You\'ve completed 10 sessions.' },
      { threshold: 25, title: 'Focus Journeyman', description: '25 sessions completed. You\'re becoming a focus expert!' },
      { threshold: 50, title: 'Focus Master', description: 'Impressive! 50 sessions of dedicated focus time.' },
      { threshold: 100, title: 'Focus Grandmaster', description: 'Extraordinary! You\'ve reached 100 focus sessions.' }
    ];
    
    for (const achievement of achievements) {
      if (sessionsCompleted === achievement.threshold) {
        return {
          id: `achievement-${achievement.threshold}`,
          type: 'achievement',
          title: achievement.title,
          description: achievement.description,
          actionText: 'Share Achievement',
          metrics: { 'Sessions': sessionsCompleted },
          timestamp: new Date()
        };
      }
    }
    
    return null;
  }
  
  generateCoachMessage(messageType: string): string {
    const messages = {
      'session-start': [
        "Let's make this a productive session! What's your main focus?",
        "Ready for focused work? What's your goal for this session?",
        "What one task do you want to accomplish in this session?"
      ],
      'break-start': [
        "Time for a break! Stand up and stretch for best results.",
        "Break time! Try looking at something 20 feet away for 20 seconds to rest your eyes.",
        "Quick break! Hydrate and take a few deep breaths."
      ],
      'distraction': [
        "Noticed a distraction? What pulled your attention away?",
        "Mind wandering? What distracted you?",
        "Quick check: what pulled you away from your focus?"
      ],
      'encouragement': [
        "You're doing great! Keep the momentum going.",
        "Stay with it - each focused minute builds your skills.",
        "You've got this! Remember why this task matters to you."
      ],
      'completion': [
        "Great job completing this session! What did you accomplish?",
        "Session complete! Take a moment to reflect on what you achieved.",
        "Well done! What progress did you make during this session?"
      ]
    };
    
    const options = messages[messageType as keyof typeof messages] || messages['encouragement'];
    return options[Math.floor(Math.random() * options.length)];
  }
}

export const aiFocusCoachService = new AIFocusCoachService();
export type { FocusInsight, FocusAnalytics };
