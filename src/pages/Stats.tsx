import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Clock, Brain, Calendar, LineChart, PieChart, TrendingUp, 
  Flame, BarChart, CheckCircle, Smile, Meh, Frown, Zap, Lightbulb,
  Target, Award, Timer, Activity, Trophy, Star, Medal,
  ArrowUp, ArrowDown, Minus, Download, Share2, Settings, Eye, Coffee
} from 'lucide-react';
import { FocusTimeBarChart, TaskDistributionChart } from '../components/Charts';
import { analyticsService, AnalyticsData } from '../services/AnalyticsService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FirestoreService from '../services/FirestoreService';
import FloatingAssistant from '../components/FloatingAssistant';
import aiService from '../services/AIService';
import { aiFocusCoachService } from '../services/AIFocusCoachService';

// Enhanced Mood & Energy Levels Component
const EnhancedMoodEnergyLevels: React.FC<{ dailyStats: any[], darkMode: boolean }> = ({ dailyStats, darkMode }) => {
  const getMoodIcon = (mood: string, focusMinutes: number) => {
    if (focusMinutes >= 60) return { icon: '💪', color: 'green', label: 'Productive' };
    if (focusMinutes >= 25) return { icon: '☕', color: 'orange', label: 'Getting Started' };
    if (focusMinutes > 0) return { icon: '🎯', color: 'blue', label: 'Active' };
    return { icon: '😴', color: 'gray', label: 'Inactive' };
  };
  
  const getColorClasses = (color: string) => {
    const colors: any = {
      green: { bg: darkMode ? 'bg-green-600/20' : 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      amber: { bg: darkMode ? 'bg-amber-600/20' : 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
      blue: { bg: darkMode ? 'bg-blue-600/20' : 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: darkMode ? 'bg-purple-600/20' : 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      red: { bg: darkMode ? 'bg-red-600/20' : 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      orange: { bg: darkMode ? 'bg-orange-600/20' : 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      gray: { bg: darkMode ? 'bg-gray-600/20' : 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
    };
    return colors[color] || colors.gray;
  };
  
  if (dailyStats.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-semibold flex items-center transition-colors ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Daily Activity Overview
          </h2>
        </div>
        <div className="text-center py-8">
          <div className={`text-gray-500 ${darkMode ? 'text-gray-400' : ''}`}>
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No activity data yet</p>
            <p className="text-sm">Start completing tasks and focus sessions to see your daily patterns</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-lg font-semibold flex items-center transition-colors ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Daily Activity Overview
        </h2>
      </div>
      
      <div className="grid grid-cols-7 gap-3">
        {dailyStats.map((day: any, idx: number) => {
          const moodData = getMoodIcon(day.mood, day.focusMinutes);
          const statusColor = day.focusMinutes >= 60 ? 'border-green-500' : day.focusMinutes >= 25 ? 'border-orange-500' : 'border-gray-600';
          const statusLabel = day.focusMinutes >= 25 ? 'Active' : 'Rest';
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-white'
              } ${statusColor} hover:shadow-lg cursor-pointer`}
            >
              <div className="text-center">
                <div className={`text-xs font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {day.date}
                </div>
                
                <div className={`text-xs mb-2 px-2 py-1 rounded-full ${
                  statusLabel === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {statusLabel}
                </div>
                
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 relative ${
                  darkMode ? 'bg-gray-600/30' : 'bg-gray-100'
                } border-2 ${statusColor}`}>
                  <span className="text-2xl">
                    {day.focusMinutes >= 60 ? '💪' : day.focusMinutes >= 25 ? '☕' : day.sessions > 0 ? '🎯' : '😴'}
                  </span>
                  
                  {day.focusMinutes > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {Math.floor(day.focusMinutes / 60) || 1}
                    </div>
                  )}
                </div>
                
                <div className={`text-xs font-medium mb-1 ${
                  day.focusMinutes >= 60 ? 'text-green-500' : day.focusMinutes >= 25 ? 'text-orange-500' : day.sessions > 0 ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {day.focusMinutes >= 60 ? 'Productive' : day.focusMinutes >= 25 ? 'Getting Started' : day.sessions > 0 ? 'Active' : 'Inactive'}
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className={`flex justify-between ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Focus</span>
                    <span className="text-orange-500">
                      {day.focusMinutes > 0 ? `${Math.floor(day.focusMinutes / 60)}h ${day.focusMinutes % 60}m` : '0m'}
                    </span>
                  </div>
                  
                  <div className={`flex justify-between ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Sessions</span>
                    <span>{day.sessions}</span>
                  </div>
                  
                  <div className={`flex justify-between ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Tasks</span>
                    <span>{day.completedTasks}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Week Summary */}
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-lg font-bold text-blue-600`}>
              {Math.floor(dailyStats.reduce((sum, d) => sum + d.focusMinutes, 0) / 60)}h {dailyStats.reduce((sum, d) => sum + d.focusMinutes, 0) % 60}m
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Focus</div>
          </div>
          
          <div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {dailyStats.reduce((sum, d) => sum + d.sessions, 0)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sessions</div>
          </div>
          
          <div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {dailyStats.reduce((sum, d) => sum + d.completedTasks, 0)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tasks</div>
          </div>
          
          <div>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {dailyStats.filter(d => d.focusMinutes > 0).length}/7
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Days</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Stats: React.FC = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, firebaseUser } = useAuth();
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [weeklyComparison, setWeeklyComparison] = useState<{ currentWeek: any[], lastWeek: any[] } | null>(null);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [goals, setGoals] = useState({ weeklyFocus: 600, weeklyTasks: 20 }); // Default goals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [celebrateAchievement, setCelebrateAchievement] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // AI Assistant state
  const [aiMessage, setAiMessage] = useState<string>("Ready to analyze your productivity patterns! Ask me about your stats or request tips for improvement.");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!firebaseUser) return;
      
      setLoading(true);
      try {
        // Load user's actual tasks
        const tasks = await FirestoreService.getTasks();
        setUserTasks(tasks);
        
        // Load analytics data
        const data = await analyticsService.getAnalyticsData(timePeriod);
        setAnalyticsData(data);
        
        // Load weekly comparison data for the chart
        const comparison = await analyticsService.getWeeklyComparison();
        setWeeklyComparison(comparison);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timePeriod, firebaseUser]);

  // Generate AI insights when data changes
  useEffect(() => {
    if (analyticsData) {
      generateAIInsights();
    }
  }, [analyticsData]);
  // Extract analytics data safely
  const dailyStats = analyticsData?.dailyStats || [];
  const totalCompletedTasks = analyticsData?.totalCompletedTasks || 0;
  const totalFocusMinutes = analyticsData?.totalFocusMinutes || 0;
  const totalSessions = analyticsData?.totalSessions || 0;
  const avgFocusMinutesPerDay = dailyStats.length > 0 ? (totalFocusMinutes / dailyStats.length) : 0;
  const avgTasksPerDay = dailyStats.length > 0 ? (totalCompletedTasks / dailyStats.length).toFixed(1) : '0.0';
  const taskCategories = analyticsData?.taskCategories || [];
  // Calculate productivity score (simple algorithm for demo)
  const productivityScore = dailyStats.length > 0 ? Math.min(100, Math.round((totalFocusMinutes / (dailyStats.length * 240)) * 100)) : 0;
  // Format minutes as hours and minutes
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  // Generate AI insights based on user data
  const generateAIInsights = async () => {
    if (isLoadingInsights) return;
    
    setIsLoadingInsights(true);
    setAiInsights(['Analyzing your productivity patterns...']); // Show loading state
    
    try {
      // Check if we have any data
      if (totalSessions === 0 && totalCompletedTasks === 0) {
        setAiInsights([
          'Start your productivity journey by completing your first focus session or task to unlock personalized insights.'
        ]);
        return;
      }

      // Prepare context for AI analysis
      const analyticsContext = {
        messageType: 'productivity_analysis',
        sessionData: {
          totalSessions,
          totalCompletedTasks,
          totalFocusMinutes,
          dailyStats: dailyStats.slice(-7), // Last 7 days
          taskCategories: taskCategories.slice(0, 3) // Top 3 categories
        },
        userPerformance: {
          avgFocusMinutesPerDay,
          productivityScore,
          streakData: {
            currentStreak: Math.floor(Math.random() * 5) + 1, // Mock data
            longestStreak: Math.floor(Math.random() * 10) + 5
          }
        },
        currentTime: new Date().toISOString()
      };

      // Use analyzeTask for structured productivity insights
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const analyzeTask = httpsCallable(functions, 'analyzeTask');
      
      const analyticsPrompt = `Analyze my productivity data and provide 5 key insights:
      
Total Sessions: ${totalSessions}
Total Completed Tasks: ${totalCompletedTasks}
Total Focus Time: ${totalFocusMinutes} minutes
Average Daily Focus: ${avgFocusMinutesPerDay} minutes
Recent 7 days: ${JSON.stringify(dailyStats.slice(-7))}
Top Task Categories: ${JSON.stringify(taskCategories.slice(0, 3))}

Please provide actionable productivity insights, patterns, and recommendations.`;

      const result = await analyzeTask({
        task: analyticsPrompt,
        model: 'deepseek-chat',
        temperature: 0.7
      });

      const data = result.data as { analysis: string };
      if (data.analysis) {
        // Parse the analysis into individual insights
        const insights = data.analysis.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[•\-\*\d\.]\s*/, '').trim())
          .filter(insight => insight.length > 20); // Filter out very short insights
        
        setAiInsights(insights.slice(0, 5)); // Limit to 5 insights
      } else {
        throw new Error('No analysis received');
      }

    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Fallback to static insights based on actual data
      const fallbackInsights = generateFallbackInsights();
      setAiInsights(fallbackInsights);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Generate fallback insights based on user data
  const generateFallbackInsights = (): string[] => {
    const insights = [];
    
    // Most productive day insight
    if (dailyStats.length > 0) {
      const daysWithActivity = dailyStats.filter(day => day.focusMinutes > 0);
      if (daysWithActivity.length > 0) {
        const mostProductiveDay = daysWithActivity.reduce((max, day) => 
          day.focusMinutes > max.focusMinutes ? day : max
        );
        const dayName = new Date(mostProductiveDay.date).toLocaleDateString('en-US', { weekday: 'long' });
        insights.push(
          `Your most productive day was ${dayName} with ${formatMinutes(mostProductiveDay.focusMinutes)} of focus time.`
        );
      }
    }
    
    // Focus time analysis
    if (avgFocusMinutesPerDay > 0) {
      const dailyHours = (avgFocusMinutesPerDay / 60).toFixed(1);
      if (parseFloat(dailyHours) >= 2) {
        insights.push(`Outstanding commitment with ${dailyHours} hours of daily focus time!`);
      } else {
        insights.push(`Your current ${dailyHours} hours of daily focus time is a good foundation.`);
      }
    }
    
    // Productivity score insight
    if (productivityScore >= 80) {
      insights.push(`Excellent productivity score of ${productivityScore}! You're in the top tier.`);
    } else if (productivityScore >= 60) {
      insights.push(`Good productivity score of ${productivityScore}. You're on the right track!`);
    } else if (productivityScore > 0) {
      insights.push(`Your productivity score of ${productivityScore} shows room for improvement.`);
    }
    
    return insights.slice(0, 5);
  };

  // AI Assistant handlers
  const handleAskAI = async () => {
    if (!aiChatInput.trim()) return;
    
    setIsAiLoading(true);
    setAiMessage(''); // Clear previous message
    
    try {
      const analyticsContext = {
        messageType: 'user_question',
        sessionData: {
          totalFocusMinutes,
          totalCompletedTasks,
          totalSessions,
          productivityScore,
          avgFocusMinutesPerDay,
          userQuestion: aiChatInput
        },
        userPerformance: {
          recentActivity: dailyStats.slice(-3)
        },
        currentTime: new Date().toISOString()
      };
      
      let streamedResponse = '';
      const streamGenerator = aiFocusCoachService.generateStreamingInsight(analyticsContext);

      for await (const chunk of streamGenerator) {
        if (chunk.isComplete && chunk.fullResponse) {
          setAiMessage(chunk.fullResponse);
          break;
        } else if (chunk.chunk) {
          streamedResponse += chunk.chunk;
          setAiMessage(streamedResponse);
        }
      }
      
    } catch (error) {
      console.error('AI chat error:', error);
      setAiMessage(`Based on your ${formatMinutes(totalFocusMinutes)} of focus time and ${totalCompletedTasks} completed tasks, you're making good progress! Keep up the consistent effort.`);
    } finally {
      setAiChatInput('');
      setIsAiLoading(false);
    }
  };

  const handleGetTip = async () => {
    setIsAiLoading(true);
    setAiMessage(''); // Clear previous message
    
    try {
      const tipContext = {
        messageType: 'productivity_tip',
        sessionData: {
          totalFocusMinutes,
          totalCompletedTasks,
          totalSessions,
          productivityScore
        },
        userPerformance: {
          avgFocusMinutesPerDay,
          recentTrends: dailyStats.slice(-5)
        },
        currentTime: new Date().toISOString()
      };
      
      let streamedTip = '';
      const streamGenerator = aiFocusCoachService.generateStreamingInsight(tipContext);

      for await (const chunk of streamGenerator) {
        if (chunk.isComplete && chunk.fullResponse) {
          const finalTip = chunk.fullResponse;
          setAiMessage(finalTip);
          
          // Auto-save the tip
          try {
            const { aiFocusTipsService } = await import('../services/AIFocusTipsService');
            const tipData = aiFocusTipsService.extractTipFromAIMessage(finalTip);
            if (tipData) {
              await aiFocusTipsService.saveTip({
                ...tipData,
                source: 'ai-coach'
              });
            }
          } catch (saveError) {
            console.error('Failed to auto-save tip:', saveError);
          }
          break;
        } else if (chunk.chunk) {
          streamedTip += chunk.chunk;
          setAiMessage(streamedTip);
        }
      }
      
    } catch (error) {
      console.error('Error getting tip:', error);
      setAiMessage("💡 Tip: Try the Pomodoro technique - 25 minutes of focused work followed by a 5-minute break. This rhythm helps maintain high concentration while preventing burnout.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Get max value for the chart scaling
  const maxFocusMinutes = dailyStats.length > 0 ? Math.max(...dailyStats.map((day: any) => day.focusMinutes)) : 0;

  // Calculate achievements
  const achievements = [
    {
      id: 'first_session',
      title: 'First Steps',
      description: 'Complete your first focus session',
      icon: Timer,
      unlocked: totalSessions >= 1,
      progress: Math.min(100, (totalSessions / 1) * 100)
    },
    {
      id: 'focus_master',
      title: 'Focus Master',
      description: 'Accumulate 10 hours of focus time',
      icon: Clock,
      unlocked: totalFocusMinutes >= 600,
      progress: Math.min(100, (totalFocusMinutes / 600) * 100)
    },
    {
      id: 'task_crusher',
      title: 'Task Crusher',
      description: 'Complete 50 tasks',
      icon: CheckCircle,
      unlocked: totalCompletedTasks >= 50,
      progress: Math.min(100, (totalCompletedTasks / 50) * 100)
    },
    {
      id: 'consistency_king',
      title: 'Consistency King',
      description: 'Focus for 7 days in a row',
      icon: Flame,
      unlocked: dailyStats.filter((d: any) => d.focusMinutes > 0).length >= 7,
      progress: Math.min(100, (dailyStats.filter((d: any) => d.focusMinutes > 0).length / 7) * 100)
    },
    {
      id: 'productivity_pro',
      title: 'Productivity Pro',
      description: 'Achieve 90+ productivity score',
      icon: Trophy,
      unlocked: productivityScore >= 90,
      progress: Math.min(100, (productivityScore / 90) * 100)
    }
  ];

  // Calculate trends (mock data for demo)
  const previousPeriodData = {
    focusMinutes: Math.max(0, totalFocusMinutes - Math.floor(Math.random() * 200)),
    tasks: Math.max(0, totalCompletedTasks - Math.floor(Math.random() * 10)),
    sessions: Math.max(0, totalSessions - Math.floor(Math.random() * 5))
  };

  const trends = {
    focusTime: totalFocusMinutes > 0 ? ((totalFocusMinutes - previousPeriodData.focusMinutes) / previousPeriodData.focusMinutes * 100) : 0,
    tasks: totalCompletedTasks > 0 ? ((totalCompletedTasks - previousPeriodData.tasks) / previousPeriodData.tasks * 100) : 0,
    sessions: totalSessions > 0 ? ((totalSessions - previousPeriodData.sessions) / previousPeriodData.sessions * 100) : 0
  };

  // Goal progress
  const goalProgress = {
    weeklyFocus: Math.min(100, (totalFocusMinutes / goals.weeklyFocus) * 100),
    weeklyTasks: Math.min(100, (totalCompletedTasks / goals.weeklyTasks) * 100)
  };

  // Check for new achievements
  useEffect(() => {
    const newAchievements = achievements.filter(a => a.unlocked && a.progress === 100);
    if (newAchievements.length > 0 && !celebrateAchievement) {
      setCelebrateAchievement(newAchievements[0].title);
      setTimeout(() => setCelebrateAchievement(null), 3000);
    }
  }, [totalSessions, totalFocusMinutes, totalCompletedTasks]);

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend < -5) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return 'text-green-500';
    if (trend < -5) return 'text-red-500';
    return 'text-gray-400';
  };
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`transition-colors shadow-sm border-b ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold transition-colors ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {user?.name?.split(' ')[0] || 'Your'} Productivity Statistics
              </h1>
              <p className={`mt-1 transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Track your progress and identify patterns • {userTasks.length} total tasks
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Empty space for future actions */}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Data Status Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Data Collection Status
              </h3>
              <p className={`text-sm mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Tasks: {userTasks.length} • Sessions: {totalSessions} • Focus Time: {formatMinutes(totalFocusMinutes)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              totalSessions > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {totalSessions > 0 ? 'Data Available' : 'No Sessions Yet'}
            </div>
          </div>
        </motion.div>

        {/* Time Period Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`inline-flex rounded-xl border transition-colors ${
            darkMode 
              ? 'border-gray-700 bg-gray-800' 
              : 'border-gray-200 bg-white'
          }`}>
            {(['week', 'month', 'quarter'] as const).map((period, index) => (
              <motion.button
                key={period}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTimePeriod(period)}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  index === 0 ? 'rounded-l-xl' : index === 2 ? 'rounded-r-xl' : ''
                } ${
                  timePeriod === period 
                    ? (darkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-indigo-600 text-white')
                    : (darkMode 
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                        : 'bg-white text-gray-700 hover:bg-gray-50')
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Achievement Celebration */}
        <AnimatePresence>
          {celebrateAchievement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className={`p-8 rounded-2xl shadow-2xl border-2 border-yellow-400 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Achievement Unlocked!
                  </h3>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {celebrateAchievement}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals & Achievements Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Weekly Goals */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Weekly Goals</h3>
              <button
                onClick={() => setShowGoalModal(true)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Focus Time</span>
                  <span className={`font-medium ${goalProgress.weeklyFocus >= 100 ? 'text-green-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {formatMinutes(totalFocusMinutes)} / {formatMinutes(goals.weeklyFocus)}
                  </span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress.weeklyFocus}%` }}
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Tasks</span>
                  <span className={`font-medium ${goalProgress.weeklyTasks >= 100 ? 'text-green-500' : darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {totalCompletedTasks} / {goals.weeklyTasks}
                  </span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgress.weeklyTasks}%` }}
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Achievements</h3>
              <button
                onClick={() => setShowAchievements(true)}
                className={`text-sm text-indigo-600 hover:text-indigo-700 flex items-center`}
              >
                <Eye className="w-4 h-4 mr-1" /> View All
              </button>
            </div>
            
            <div className="space-y-3">
              {achievements.slice(0, 3).map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div key={achievement.id} className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${achievement.unlocked ? (darkMode ? 'text-white' : 'text-gray-800') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                        {achievement.title}
                      </p>
                      <div className={`w-full bg-gray-200 rounded-full h-1 mt-1 ${darkMode ? 'bg-gray-700' : ''}`}>
                        <div 
                          className={`h-1 rounded-full ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-300'}`}
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Quick Actions</h3>
            
            <div className="space-y-3">
              <button className={`w-full p-3 rounded-lg border transition-all hover:shadow-md ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Export Stats</span>
                </div>
              </button>
              
              <button className={`w-full p-3 rounded-lg border transition-all hover:shadow-md ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <Share2 className="w-4 h-4 text-green-600" />
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Share Progress</span>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Top Stats Cards with Trends */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Focus Time Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Focus Time
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {formatMinutes(totalFocusMinutes)}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-indigo-600">
                    ~{formatMinutes(avgFocusMinutesPerDay)}/day
                  </p>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(trends.focusTime)}
                    <span className={`text-xs font-medium ${getTrendColor(trends.focusTime)}`}>
                      {Math.abs(trends.focusTime).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-indigo-600/20' : 'bg-indigo-50'
              }`}>
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </motion.div>
          
          {/* Focus Sessions Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Focus Sessions
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {totalSessions}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-green-600">
                    ~{(totalSessions / Math.max(dailyStats.length, 1)).toFixed(1)}/day
                  </p>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(trends.sessions)}
                    <span className={`text-xs font-medium ${getTrendColor(trends.sessions)}`}>
                      {Math.abs(trends.sessions).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-green-600/20' : 'bg-green-50'
              }`}>
                <BarChart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>
          
          {/* Tasks Completed Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Tasks Completed
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {totalCompletedTasks}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-purple-600">
                    ~{avgTasksPerDay}/day
                  </p>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(trends.tasks)}
                    <span className={`text-xs font-medium ${getTrendColor(trends.tasks)}`}>
                      {Math.abs(trends.tasks).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-purple-600/20' : 'bg-purple-50'
              }`}>
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
          
          {/* Productivity Score Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Productivity Score
                </p>
                <h3 className={`text-2xl font-bold transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {productivityScore}
                </h3>
                <p className="text-sm text-amber-600 mt-1">
                  {productivityScore >= 80 ? 'Excellent!' : productivityScore >= 60 ? 'Good progress!' : 'Keep going!'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-amber-600/20' : 'bg-amber-50'
              }`}>
                <Flame className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Focus Time by Day Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl shadow-sm p-6 border lg:col-span-2 transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-semibold flex items-center transition-colors ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <LineChart className="h-5 w-5 mr-2 text-indigo-600" />
                Focus Time by Day
              </h2>
            </div>
            
            <FocusTimeBarChart 
              currentWeekData={weeklyComparison?.currentWeek || []}
              lastWeekData={weeklyComparison?.lastWeek || []}
              formatMinutes={formatMinutes} 
            />
          </motion.div>
          
          {/* Task Distribution Chart */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-xl shadow-sm p-6 border transition-all hover:shadow-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-semibold flex items-center transition-colors ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                Task Distribution
              </h2>
            </div>
            
            <TaskDistributionChart data={taskCategories} />
          </motion.div>
        </div>

        {/* AI Insights Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-xl shadow-sm p-6 border mb-8 transition-all hover:shadow-lg ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center mb-6">
            <div className={`p-2 rounded-lg mr-3 ${
              darkMode ? 'bg-purple-600/20' : 'bg-purple-50'
            }`}>
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className={`text-lg font-semibold transition-colors ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>
              AI Productivity Insights
            </h2>
          </div>
          
          <div className={`transition-colors ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {isLoadingInsights ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <p>Analyzing your productivity patterns...</p>
              </div>
            ) : (
              <>
                <p className="mb-4">Based on your productivity patterns:</p>
                <ul className="space-y-3">
                  {aiInsights.length > 0 ? (
                    aiInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-600 mr-3 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start">
                      <span className="text-indigo-600 mr-3 mt-1">•</span>
                      <span>Complete more focus sessions to unlock personalized AI insights about your productivity patterns.</span>
                    </li>
                  )}
                </ul>
                <button
                  onClick={generateAIInsights}
                  className={`mt-4 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                    darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } disabled:opacity-50`}
                  disabled={isLoadingInsights}
                >
                  {isLoadingInsights ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Refresh Insights</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
        
        {/* Enhanced Mood & Energy Levels Section */}
        <EnhancedMoodEnergyLevels dailyStats={dailyStats} darkMode={darkMode} />
      </div>

      {/* Achievements Modal */}
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-2xl w-full rounded-xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>All Achievements</h2>
                <button
                  onClick={() => setShowAchievements(false)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div key={achievement.id} className={`p-4 rounded-lg border ${achievement.unlocked ? (darkMode ? 'bg-yellow-900/20 border-yellow-600' : 'bg-yellow-50 border-yellow-200') : (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-3 rounded-lg ${achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-400'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${achievement.unlocked ? (darkMode ? 'text-white' : 'text-gray-800') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                            {achievement.title}
                          </h3>
                          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {achievement.description}
                          </p>
                          <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-300'}`}
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {achievement.progress.toFixed(0)}% Complete
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGoalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full rounded-xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Set Weekly Goals</h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Weekly Focus Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={goals.weeklyFocus}
                    onChange={(e) => setGoals({...goals, weeklyFocus: parseInt(e.target.value) || 0})}
                    className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Weekly Tasks
                  </label>
                  <input
                    type="number"
                    value={goals.weeklyTasks}
                    onChange={(e) => setGoals({...goals, weeklyTasks: parseInt(e.target.value) || 0})}
                    className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Goals
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant - Always Visible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-highest"
      >
        <FloatingAssistant
          isAiLoading={isAiLoading}
          aiMessage={aiMessage}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          onAskAI={handleAskAI}
          onGetTip={handleGetTip}
        />
      </motion.div>
    </div>
  );
};

export default Stats;
