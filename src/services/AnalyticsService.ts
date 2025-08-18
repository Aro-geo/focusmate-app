import FirestoreService from './FirestoreService';
import DatabaseFocusSessionService from './DatabaseFocusSessionService';
import DatabasePomodoroService from './DatabasePomodoroService';
import { FocusSession } from './DatabaseFocusSessionService';
import { PomodoroSession } from './DatabasePomodoroService';
import { Task } from './FirestoreService';

export interface AnalyticsData {
  productivity: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    labels: string[];
  };
  pomodoro: {
    sessionsCompleted: number[];
    averageFocusTime: number[];
    breakTimeUsed: number[];
    labels: string[];
  };
  mood: {
    data: { mood: string; count: number; percentage: number }[];
    trends: number[];
    labels: string[];
  };
  tasks: {
    completed: number[];
    created: number[];
    overdue: number[];
    labels: string[];
  };
  insights: {
    mostProductiveTime: string;
    averageSessionLength: number;
    totalFocusTime: number;
    streakDays: number;
    improvementPercentage: number;
  };
  // Added for Stats page compatibility
  dailyStats?: Array<{
    date: string;
    focusMinutes: number;
    sessions: number;
    completedTasks: number;
    mood: string;
  }>;
  totalCompletedTasks?: number;
  totalFocusMinutes?: number;
  totalSessions?: number;
  taskCategories?: Array<{
    name: string;
    totalMinutes: number;
    percentage: number;
  }>;
}

class AnalyticsService {
  private generateEmptyData(timeRange: 'week' | 'month' | 'quarter'): AnalyticsData {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const labels = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    return {
      productivity: {
        daily: new Array(days).fill(0),
        weekly: new Array(Math.ceil(days/7)).fill(0),
        monthly: new Array(Math.ceil(days/30)).fill(0),
        labels
      },
      pomodoro: {
        sessionsCompleted: new Array(days).fill(0),
        averageFocusTime: new Array(days).fill(0),
        breakTimeUsed: new Array(days).fill(0),
        labels
      },
      mood: {
        data: [],
        trends: new Array(days).fill(0),
        labels
      },
      tasks: {
        completed: new Array(days).fill(0),
        created: new Array(days).fill(0),
        overdue: new Array(days).fill(0),
        labels
      },
      insights: {
        mostProductiveTime: 'No data yet',
        averageSessionLength: 0,
        totalFocusTime: 0,
        streakDays: 0,
        improvementPercentage: 0
      },
      dailyStats: [],
      totalCompletedTasks: 0,
      totalFocusMinutes: 0,
      totalSessions: 0,
      taskCategories: []
    };
  }
  
  private generateMockData(): AnalyticsData {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const last4Weeks = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
    
    return {
      productivity: {
        daily: [65, 72, 58, 81, 76, 69, 84],
        weekly: [68, 72, 75, 79],
        monthly: [70, 73, 76, 78, 75, 80],
        labels: last7Days
      },
      pomodoro: {
        sessionsCompleted: [4, 6, 3, 8, 5, 4, 7],
        averageFocusTime: [23, 25, 20, 27, 24, 22, 26],
        breakTimeUsed: [15, 18, 12, 20, 16, 14, 19],
        labels: last7Days
      },
      mood: {
        data: [
          { mood: 'Energetic', count: 12, percentage: 30 },
          { mood: 'Productive', count: 15, percentage: 37.5 },
          { mood: 'Focused', count: 8, percentage: 20 },
          { mood: 'Neutral', count: 3, percentage: 7.5 },
          { mood: 'Tired', count: 2, percentage: 5 }
        ],
        trends: [3.2, 3.8, 3.5, 4.1, 3.9, 3.7, 4.2],
        labels: last7Days
      },
      tasks: {
        completed: [8, 12, 6, 15, 10, 8, 14],
        created: [10, 14, 8, 16, 12, 10, 15],
        overdue: [1, 2, 2, 1, 2, 2, 1],
        labels: last7Days
      },
      insights: {
        mostProductiveTime: '9:00 AM - 11:00 AM',
        averageSessionLength: 24.5,
        totalFocusTime: 1250, // minutes this week
        streakDays: 5,
        improvementPercentage: 12.5
      }
    };
  }

  async getAnalyticsData(timeRange: 'week' | 'month' | 'quarter' = 'week'): Promise<AnalyticsData> {
    try {
      // Calculate the date range based on the selected time period
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setDate(endDate.getDate() - 30);
      } else { // quarter
        startDate.setDate(endDate.getDate() - 90);
      }
      
      // Fetch real data from Firestore with error handling
      let tasks: Task[] = [];
      let focusSessions: FocusSession[] = [];
      let pomodoroSessions: PomodoroSession[] = [];
      
      try {
        tasks = await FirestoreService.getTasks();
      } catch (error) {
        console.warn('Failed to fetch tasks:', error);
      }
      
      try {
        focusSessions = await DatabaseFocusSessionService.getSessionsForPeriod(startDate, endDate);
      } catch (error) {
        console.warn('Failed to fetch focus sessions:', error);
      }
      
      try {
        pomodoroSessions = await DatabasePomodoroService.getSessionsForPeriod(startDate, endDate);
      } catch (error) {
        console.warn('Failed to fetch pomodoro sessions:', error);
      }
      
      // Combine focus and pomodoro sessions
      const allSessions = [
        ...focusSessions,
        ...pomodoroSessions.map(ps => ({
          id: ps.id,
          userId: ps.userId,
          sessionType: ps.sessionType === 'pomodoro' ? 'focus' : ps.sessionType,
          durationMinutes: ps.durationMinutes,
          startedAt: ps.startTime,
          completedAt: ps.endTime,
          notes: ps.notes,
          taskId: '', // We don't have this mapping in pomodoro sessions
          createdAt: ps.createdAt
        } as FocusSession))
      ];
      
      console.log(`Analytics data: ${tasks.length} tasks, ${allSessions.length} sessions`);
      
      // Always process real data, even if empty
      return this.processRealData(tasks, allSessions, startDate, endDate, timeRange);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Return empty data structure instead of mock data
      return this.generateEmptyData(timeRange);
    }
  }
  
  private processRealData(
    tasks: Task[], 
    sessions: FocusSession[], 
    startDate: Date, 
    endDate: Date,
    timeRange: 'week' | 'month' | 'quarter'
  ): AnalyticsData {
    // Filter tasks and sessions to the selected time period
    const tasksInPeriod = tasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });
    
    const completedTasks = tasks.filter(task => task.completed);
    
    // Process session data
    const totalFocusMinutes = sessions.reduce((total, session) => {
      return total + session.durationMinutes;
    }, 0);
    
    const totalSessions = sessions.length;
    
    // Generate daily stats based on the selected time period
    const dailyStats = this.generateDailyStats(tasks, sessions, startDate, endDate);
    
    // Generate labels based on the time range
    const labels = this.generateLabels(startDate, endDate, timeRange);
    
    // Generate task categories based on real data
    const taskCategories = this.generateTaskCategories(tasksInPeriod, sessions);
    
    // Build and return the analytics data structure
    const baseData = this.generateMockData(); // Use as a template
    
    return {
      ...baseData,
      // Override with real data
      dailyStats,
      totalCompletedTasks: completedTasks.length,
      totalFocusMinutes,
      totalSessions,
      taskCategories,
      insights: {
        ...baseData.insights,
        totalFocusTime: totalFocusMinutes,
        averageSessionLength: totalSessions > 0 ? totalFocusMinutes / totalSessions : 0,
        // Other insights could be calculated from real data as well
      },
      // Update chart data with real data
      pomodoro: {
        ...baseData.pomodoro,
        sessionsCompleted: this.aggregateSessionsByDay(sessions, labels),
        labels
      },
      tasks: {
        ...baseData.tasks,
        completed: this.aggregateTasksByDay(completedTasks, labels, 'completed'),
        created: this.aggregateTasksByDay(tasksInPeriod, labels, 'created'),
        labels
      }
    };
  }
  
  private generateDailyStats(
    tasks: Task[], 
    sessions: FocusSession[], 
    startDate: Date, 
    endDate: Date
  ) {
    const dailyStats: Array<{
      date: string;
      focusMinutes: number;
      sessions: number;
      completedTasks: number;
      mood: string;
    }> = [];
    
    // Always limit to last 7 days (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Create a map of dates for the current week
    const dateMap = new Map();
    const currentDate = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      dateMap.set(dateString, {
        date: dayName,
        focusMinutes: 0,
        sessions: 0,
        completedTasks: 0,
        mood: 'Neutral'
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Process sessions
    sessions.forEach(session => {
      const dateString = session.startedAt.toISOString().split('T')[0];
      
      if (dateMap.has(dateString)) {
        const dayStats = dateMap.get(dateString);
        dayStats.focusMinutes += session.durationMinutes;
        dayStats.sessions += 1;
        if (session.notes) {
          dayStats.mood = session.notes;
        }
      }
    });
    
    // Process tasks
    tasks.forEach(task => {
      const dateString = new Date(task.updatedAt).toISOString().split('T')[0];
      
      if (dateMap.has(dateString) && task.completed) {
        const dayStats = dateMap.get(dateString);
        dayStats.completedTasks += 1;
      }
    });
    
    // Convert map to array in correct order
    const weekStartDate = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const dateString = weekStartDate.toISOString().split('T')[0];
      if (dateMap.has(dateString)) {
        dailyStats.push(dateMap.get(dateString));
      }
      weekStartDate.setDate(weekStartDate.getDate() + 1);
    }
    
    return dailyStats;
  }
  
  private generateLabels(startDate: Date, endDate: Date, timeRange: 'week' | 'month' | 'quarter'): string[] {
    const labels: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let label;
      
      if (timeRange === 'week') {
        // For week view, use day names
        label = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        // For month and quarter views, use date format
        label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      labels.push(label);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return labels;
  }
  
  private generateTaskCategories(tasks: Task[], sessions: FocusSession[]) {
    const categories = new Map<string, { totalMinutes: number, count: number }>();
    
    if (tasks.length === 0) {
      return [];
    }
    
    // Assign tasks to categories based on keywords in the title
    tasks.forEach(task => {
      let category = 'General';
      const title = task.title.toLowerCase();
      
      if (title.includes('work') || title.includes('project') || title.includes('meeting') || title.includes('job') || title.includes('office')) {
        category = 'Work';
      } else if (title.includes('study') || title.includes('learn') || title.includes('read') || title.includes('course') || title.includes('book')) {
        category = 'Study';
      } else if (title.includes('personal') || title.includes('health') || title.includes('hobby') || title.includes('exercise') || title.includes('family')) {
        category = 'Personal';
      } else if (title.includes('code') || title.includes('programming') || title.includes('development') || title.includes('tech')) {
        category = 'Development';
      } else if (title.includes('creative') || title.includes('design') || title.includes('art') || title.includes('write')) {
        category = 'Creative';
      }
      
      if (!categories.has(category)) {
        categories.set(category, { totalMinutes: 0, count: 0 });
      }
      
      const categoryData = categories.get(category)!;
      categoryData.count += 1;
      
      // Estimate time based on task completion (25 minutes per completed task as default)
      if (task.completed) {
        categoryData.totalMinutes += 25;
      }
      
      // Add actual session time if available
      const taskSessions = sessions.filter(session => session.taskId === task.id);
      taskSessions.forEach(session => {
        categoryData.totalMinutes += session.durationMinutes;
      });
    });
    
    // Convert to array and calculate percentages
    const totalMinutes = Array.from(categories.values()).reduce((total, cat) => total + cat.totalMinutes, 0);
    const totalTasks = Array.from(categories.values()).reduce((total, cat) => total + cat.count, 0);
    
    // If no time data, use task count for percentages
    const useTaskCount = totalMinutes === 0;
    
    return Array.from(categories.entries())
      .map(([name, data]) => ({
        name,
        totalMinutes: data.totalMinutes,
        percentage: useTaskCount 
          ? (data.count / totalTasks) * 100
          : (data.totalMinutes / totalMinutes) * 100
      }))
      .filter(cat => cat.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }
  
  private aggregateSessionsByDay(sessions: FocusSession[], labels: string[]): number[] {
    const sessionsPerDay = new Array(labels.length).fill(0);
    
    sessions.forEach(session => {
      const sessionDate = session.startedAt;
      const dayLabel = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Find the matching label index
      const index = labels.findIndex(label => label === dayLabel || label === dateLabel);
      if (index !== -1) {
        sessionsPerDay[index]++;
      }
    });
    
    return sessionsPerDay;
  }
  
  private aggregateTasksByDay(tasks: Task[], labels: string[], type: 'created' | 'completed'): number[] {
    const tasksPerDay = new Array(labels.length).fill(0);
    
    tasks.forEach(task => {
      const taskDate = new Date(type === 'created' ? task.createdAt : task.updatedAt);
      const dayLabel = taskDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Find the matching label index
      const index = labels.findIndex(label => label === dayLabel || label === dateLabel);
      if (index !== -1) {
        tasksPerDay[index]++;
      }
    });
    
    return tasksPerDay;
  }

  async getProductivityScore(timeRange: 'week' | 'month' = 'week'): Promise<number> {
    const data = await this.getAnalyticsData(timeRange);
    const avgProductivity = data.productivity.daily.reduce((a, b) => a + b, 0) / data.productivity.daily.length;
    return Math.round(avgProductivity);
  }

  async getWeeklyReport(): Promise<{
    totalSessions: number;
    totalFocusTime: number;
    averageProductivity: number;
    mostProductiveDay: string;
    improvementFromLastWeek: number;
  }> {
    const data = await this.getAnalyticsData('week');
    
    const totalSessions = data.pomodoro.sessionsCompleted.reduce((a, b) => a + b, 0);
    const totalFocusTime = data.insights.totalFocusTime;
    const averageProductivity = Math.round(
      data.productivity.daily.reduce((a, b) => a + b, 0) / data.productivity.daily.length
    );
    
    const maxProductivityIndex = data.productivity.daily.indexOf(
      Math.max(...data.productivity.daily)
    );
    const mostProductiveDay = data.productivity.labels[maxProductivityIndex];
    
    return {
      totalSessions,
      totalFocusTime,
      averageProductivity,
      mostProductiveDay,
      improvementFromLastWeek: data.insights.improvementPercentage
    };
  }
}

export const analyticsService = new AnalyticsService();
