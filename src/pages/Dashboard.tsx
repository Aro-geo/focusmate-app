import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  Brain, 
  Lightbulb,
  Smile,
  Meh,
  Frown,
  Coffee,
  Target,
  Clock,
  TrendingUp,
  BookOpen,
  MessageCircle,
  Loader,
  RefreshCw,
  Activity,
  Calendar
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingCard from '../components/FloatingCard';
import StaggeredList from '../components/StaggeredList';
import FloatingAssistant from '../components/FloatingAssistant';
import SubscriptionStatus from '../components/SubscriptionStatus';
import UpgradePrompt from '../components/UpgradePrompt';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import firestoreService from '../services/FirestoreService';
import aiService from '../services/AIService';
import subscriptionService from '../services/SubscriptionService';
import { analyticsService } from '../services/AnalyticsService';
import { taskAnalysisService } from '../services/TaskAnalysisService';

// Daily Activity Overview Component
const DailyActivityOverview: React.FC = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadWeeklyData = async () => {
      if (!user) return;
      try {
        const data = await analyticsService.getAnalyticsData('week');
        
        // Generate all 7 days of current week with real data
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekData = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 7; i++) {
          const currentDay = new Date(weekStart);
          currentDay.setDate(weekStart.getDate() + i);
          
          const dayData = data.dailyStats?.find(stat => {
            const statDate = new Date();
            statDate.setDate(today.getDate() - daysFromMonday + i);
            return stat.date === dayNames[i];
          });
          
          weekData.push({
            date: dayNames[i] + ', ' + currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            focusMinutes: dayData?.focusMinutes || 0,
            sessions: dayData?.sessions || 0,
            completedTasks: dayData?.completedTasks || 0,
            mood: dayData?.mood || 'Inactive',
            isToday: i === daysFromMonday
          });
        }
        
        setWeeklyData(weekData);
      } catch (error) {
        console.error('Failed to load weekly data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWeeklyData();
  }, [user]);

  const getStatusInfo = (focusMinutes: number, sessions: number) => {
    if (focusMinutes >= 60) return { status: 'Active', color: 'border-green-500', icon: '💪', label: 'Productive' };
    if (focusMinutes >= 25) return { status: 'Active', color: 'border-orange-500', icon: '☕', label: 'Getting Started' };
    if (sessions > 0) return { status: 'Active', color: 'border-blue-500', icon: '🎯', label: 'Active' };
    return { status: 'Rest', color: 'border-gray-600', icon: '😴', label: 'Inactive' };
  };

  if (loading) {
    return (
      <FloatingCard className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700" delay={0.8}>
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </FloatingCard>
    );
  }

  return (
    <FloatingCard className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700" delay={0.8}>
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Daily Activity Overview</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {weeklyData.map((day, index) => {
          const statusInfo = getStatusInfo(day.focusMinutes, day.sessions);
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 bg-gray-50 dark:bg-gray-700/50 ${
                day.isToday ? 'border-orange-500' : statusInfo.color
              } transition-all hover:shadow-md`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {day.date}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  statusInfo.status === 'Active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {statusInfo.status}
                </span>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                  statusInfo.status === 'Active' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600'
                }`}>
                  <span className="text-2xl">{statusInfo.icon}</span>
                </div>
              </div>
              
              <div className="text-center mb-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {statusInfo.label}
                </p>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Focus</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {day.focusMinutes > 0 ? `${Math.floor(day.focusMinutes / 60)}h ${day.focusMinutes % 60}m` : '0m'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Sessions</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{day.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tasks</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{day.completedTasks}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </FloatingCard>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [newTask, setNewTask] = React.useState('');
  const [pomodoroActive, setPomodoroActive] = React.useState(false);
  const [pomodoroTime, setPomodoroTime] = React.useState(25 * 60); // 25 minutes in seconds
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  
  // AI Assistant states
  const [aiMessage, setAiMessage] = React.useState("Welcome! I'm here to help you stay focused and productive.");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiChatInput, setAiChatInput] = React.useState('');
  const [taskSuggestions, setTaskSuggestions] = React.useState<Record<string, string[]>>({});
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
  const [upgradeReason, setUpgradeReason] = React.useState<'ai_limit' | 'feature_limit' | 'trial_expired'>('ai_limit');

  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: 'text-green-500' },
    { id: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
    { id: 'tired', icon: Frown, label: 'Tired', color: 'text-red-500' },
  ];

  // Load tasks and initial AI message
  React.useEffect(() => {
    const loadTasks = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const userTasks = await firestoreService.getTasks();
        setTasks(userTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.completed ? 'completed' : 'pending',
          priority: task.priority || 'medium'
        })));
        
        const incompleteTasks = userTasks.filter(task => !task.completed);
        const greeting = getGreeting();
        if (incompleteTasks.length > 0) {
          setAiMessage(`${greeting}! You have ${incompleteTasks.length} pending tasks. Let's tackle them one by one!`);
        } else {
          setAiMessage(`${greeting}! Great job on completing your tasks. Ready for something new?`);
        }
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTasks();
  }, [user]);

  const addTask = async () => {
    if (newTask.trim() && user) {
      try {
        const taskId = await firestoreService.addTask(newTask.trim());
        const newTaskObj = {
          id: taskId,
          title: newTask.trim(),
          status: 'pending',
          priority: 'medium'
        };
        setTasks(prev => [...prev, newTaskObj]);
        
        // Analyze task with AI (if subscription allows)
        try {
          const canAccess = await subscriptionService.canAccessAIFeatures(user.id);
          if (canAccess) {
            const analysis = await taskAnalysisService.analyzeTask(newTask.trim());
            await subscriptionService.recordAIRequest(user.id);
            if (analysis.suggestions.length > 0) {
              setTaskSuggestions(prev => ({
                ...prev,
                [taskId]: analysis.suggestions
              }));
              setAiMessage(`Added "${newTask}"! AI suggests: ${analysis.suggestions[0]}`);
            } else {
              setAiMessage(`Great! I added "${newTask}" to your tasks. Let's get it done!`);
            }
          } else {
            setAiMessage(`Great! I added "${newTask}" to your tasks. Let's get it done!`);
          }
        } catch (error) {
          setAiMessage(`Great! I added "${newTask}" to your tasks. Let's get it done!`);
        }
        
        setNewTask('');
      } catch (error) {
        console.error('Error adding task:', error);
        setAiMessage('Sorry, there was an error adding that task. Please try again.');
      }
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newCompleted = task.status !== 'completed';
      await firestoreService.updateTask(taskId, { completed: newCompleted });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newCompleted ? 'completed' : 'pending' } : t
      ));
      
      setAiMessage(newCompleted 
        ? `Excellent! You completed "${task.title}". Keep up the great work!`
        : `Task "${task.title}" marked as pending. You can do it!`);
    } catch (error) {
      console.error('Error toggling task:', error);
      setAiMessage('Sorry, there was an error updating that task. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // AI Assistant functions
  const handleAskAI = async () => {
    if (!aiChatInput.trim() || !user) return;
    
    // Check subscription limits
    const canAccess = await subscriptionService.canAccessAIFeatures(user.id);
    if (!canAccess) {
      setUpgradeReason('ai_limit');
      setShowUpgradePrompt(true);
      setAiMessage("You've reached your daily AI request limit. Upgrade to Pro for unlimited access!");
      return;
    }
    
    setIsAiLoading(true);
    try {
      const incompleteTasks = tasks.filter(task => task.status === 'pending');
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const context = `User: ${user.name}. Current tasks: ${incompleteTasks.map(t => t.title).join(', ')}. Completed: ${completedTasks.length}/${tasks.length} tasks. Mood: ${selectedMood || 'not set'}.`;
      
      const response = await aiService.chat(aiChatInput, context);
      await subscriptionService.recordAIRequest(user.id);
      setAiMessage(response.response);
      setAiChatInput('');
    } catch (error) {
      console.error('AI chat error:', error);
      setAiMessage("I'm having trouble connecting right now. Try taking a short break and then let's tackle your tasks together!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetTip = async () => {
    if (!user) return;
    
    // Check subscription limits
    const canAccess = await subscriptionService.canAccessAIFeatures(user.id);
    if (!canAccess) {
      setUpgradeReason('ai_limit');
      setShowUpgradePrompt(true);
      setAiMessage("You've reached your daily AI request limit. Upgrade to Pro for unlimited access!");
      return;
    }
    
    setIsAiLoading(true);
    try {
      const incompleteTasks = tasks.filter(task => task.status === 'pending');
      
      if (incompleteTasks.length > 0) {
        // Analyze the first incomplete task
        const analysis = await taskAnalysisService.analyzeTask(incompleteTasks[0].title);
        const suggestion = analysis.suggestions[0] || 'Break this task into smaller steps';
        await subscriptionService.recordAIRequest(user.id);
        setAiMessage(`💡 For "${incompleteTasks[0].title}": ${suggestion}`);
        
        // Auto-save the tip
        try {
          const { aiFocusTipsService } = await import('../services/AIFocusTipsService');
          const tipData = aiFocusTipsService.extractTipFromAIMessage(suggestion);
          if (tipData) {
            await aiFocusTipsService.saveTip({
              ...tipData,
              source: 'ai-coach'
            });
          }
        } catch (saveError) {
          console.error('Failed to auto-save tip:', saveError);
        }
      } else {
        const tip = await aiService.getProductivityTip();
        await subscriptionService.recordAIRequest(user.id);
        setAiMessage(tip);
      }
    } catch (error) {
      console.error('AI tip error:', error);
      setAiMessage("Here's a quick tip: Break your next task into smaller 15-minute chunks for better focus!");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  // Error state
  if (error) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4 text-center max-w-md"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  // No user data
  if (!user) {
    return null;
  }

  const firstName = user.name?.split(' ')[0] || 'User';
  const greeting = getGreeting();
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-4 md:px-8 py-4 md:py-6"
        >
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {greeting}, {firstName}!
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
                {pendingTasks.length > 0 
                  ? `You have ${pendingTasks.length} tasks to complete today.`
                  : "All caught up! Ready for something new?"
                }
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Today's Progress</p>
                <motion.p 
                  className="text-lg md:text-2xl font-bold text-indigo-600 dark:text-indigo-400"
                  key={`${completedTasks}-${totalTasks}`}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {completedTasks}/{totalTasks}
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Subscription Status */}
        <SubscriptionStatus compact={false} />

        {/* Main Dashboard Content */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            
            {/* Left Column - Daily Tasks & Pomodoro */}
            <div className="space-y-4 md:space-y-6">
              {/* Quick Stats */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 dark:border-gray-700"
                delay={0.1}
              >
                <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">Today's Overview</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <motion.div 
                    className="text-center p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Target className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                    <motion.p 
                      className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400"
                      key={completedTasks}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {completedTasks}
                    </motion.p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Completed</p>
                  </motion.div>
                  <motion.div 
                    className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <motion.p 
                      className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                      key={0}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      0m
                    </motion.p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Focused</p>
                  </motion.div>
                </div>
              </FloatingCard>

              {/* Daily Tasks */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.2}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Daily Tasks</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{completedTasks}/{totalTasks} completed</span>
                </div>
                
                {/* Add new task */}
                <motion.div 
                  className="flex space-x-2 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mobile-input"
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <motion.button
                    onClick={addTask}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Add task"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={18} />
                  </motion.button>
                </motion.div>

                {/* Task list */}
                <StaggeredList className="space-y-3" staggerDelay={0.05}>
                  {tasks?.map((task) => (
                    <motion.div
                      key={task.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        task.status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      whileHover={{ x: 5 }}
                      layout
                    >
                      <motion.button
                        onClick={() => toggleTask(task.id)}
                        className={`transition-colors ${
                        task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </motion.button>
                    <span
                      className={`flex-1 ${
                        task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </motion.div>
                  )) || []}
                </StaggeredList>
              </FloatingCard>

              {/* Pomodoro Timer */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.4}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pomodoro Timer</h3>
                  <Coffee className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="text-center">
                  <motion.div 
                    className="text-4xl font-bold text-gray-800 dark:text-white mb-4"
                    key={pomodoroTime}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatTime(pomodoroTime)}
                  </motion.div>
                  
                  <div className="flex justify-center space-x-4 mb-4">
                    <motion.button
                      onClick={() => setPomodoroActive(!pomodoroActive)}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        pomodoroActive
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {pomodoroActive ? (
                        <>
                          <Pause className="w-4 h-4 inline mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 inline mr-2" />
                          Start
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setPomodoroTime(25 * 60);
                        setPomodoroActive(false);
                      }}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Reset
                    </motion.button>
                  </div>

                  <div className="flex justify-center space-x-2">
                    {[25, 15, 5].map((minutes) => (
                      <motion.button
                        key={minutes}
                        onClick={() => setPomodoroTime(minutes * 60)}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {minutes}m
                      </motion.button>
                    ))}
                  </div>
                </div>
              </FloatingCard>

              {/* Productivity Tip */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.5}
              >
                <motion.div 
                  className="flex items-center space-x-3 mb-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Tip</h3>
                </motion.div>
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Try the 2-minute rule: If a task takes less than 2 minutes, do it immediately 
                  instead of adding it to your to-do list. This prevents small tasks from accumulating.
                </motion.p>
              </FloatingCard>
            </div>

            {/* Right Column - Mood & Quick Actions */}
            <div className="space-y-4 md:space-y-6">
              {/* Mood Selector */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.6}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">How are you feeling?</h3>
                <StaggeredList className="grid grid-cols-1 gap-3" staggerDelay={0.1}>
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        selectedMood === mood.id
                          ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <mood.icon className={`w-6 h-6 ${mood.color}`} />
                      <span className="font-medium text-gray-700 dark:text-gray-200">{mood.label}</span>
                    </motion.button>
                  ))}
                </StaggeredList>
              </FloatingCard>

              {/* Quick Actions */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.7}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                <StaggeredList className="space-y-3" staggerDelay={0.1}>
                  <motion.button 
                    className="w-full flex items-center space-x-3 p-3 text-left bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/app/journal')}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>New Journal Entry</span>
                  </motion.button>
                  <motion.button 
                    className="w-full flex items-center space-x-3 p-3 text-left bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/app/stats')}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>View Analytics</span>
                  </motion.button>
                  <motion.button 
                    className="w-full flex items-center space-x-3 p-3 text-left bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/app/profile')}
                  >
                    <Target className="w-5 h-5" />
                    <span>Set Goals</span>
                  </motion.button>
                </StaggeredList>
              </FloatingCard>

              {/* Daily Activity Overview */}
              <DailyActivityOverview />
            </div>
          </div>
        </div>

        {/* Floating AI Assistant */}
        <FloatingAssistant
          isAiLoading={isAiLoading}
          aiMessage={aiMessage}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          onAskAI={handleAskAI}
          onGetTip={handleGetTip}
        />

        {/* Upgrade Prompt */}
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          reason={upgradeReason}
        />
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;
