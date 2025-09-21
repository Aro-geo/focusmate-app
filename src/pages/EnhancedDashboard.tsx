import React, { useReducer, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  Loader,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  CheckSquare,
  Clock8,
  AlertTriangle,
  ArrowUp,
  BarChart,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingCard from '../components/FloatingCard';
import StaggeredList from '../components/StaggeredList';
import FloatingAssistant from '../components/FloatingAssistant';
import SmartTaskInput from '../components/SmartTaskInput';
import ProductivityInsights from '../components/ProductivityInsights';
import MobileDashboard from '../components/MobileDashboard';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { offlineFirebaseService } from '../services/OfflineFirebaseService';
import useResponsive from '../hooks/useResponsive';

const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const { isMobile } = useResponsive();

  // Render mobile component if on mobile
  if (isMobile) {
    return (
      <AnimatedPage>
        <MobileDashboard />
      </AnimatedPage>
    );
  }

  // Render desktop component
  return <EnhancedDashboardDesktop />;
};

// Desktop dashboard component with all hooks
const EnhancedDashboardDesktop: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user, firebaseUser } = useAuth();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
  const [newTask, setNewTask] = React.useState('');
  const [pomodoroActive, setPomodoroActive] = React.useState(false);
  const [pomodoroTime, setPomodoroTime] = React.useState(25 * 60);
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  
  // New state for additional features
  const [taskFilter, setTaskFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [focusStreak, setFocusStreak] = React.useState(0);
  const [focusTime, setFocusTime] = React.useState(0);
  const [completionRate, setCompletionRate] = React.useState(0);
  const [userActivity, setUserActivity] = React.useState<any[]>([]);
  const [aiInsights, setAiInsights] = React.useState<any[]>([]);
  // Keep a reference to the last fetched raw tasks for insight regeneration
  const lastUserTasksRef = React.useRef<any[]>([]);
  
  const [aiMessage, setAiMessage] = React.useState("Welcome! I'm here to help you stay focused and productive.");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiChatInput, setAiChatInput] = React.useState('');

  const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: 'text-green-500' },
    { id: 'okay', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
    { id: 'tired', icon: Frown, label: 'Tired', color: 'text-red-500' },
  ];

  React.useEffect(() => {
    const loadTasks = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Load cached AI insights immediately to avoid empty state on refresh
        try {
          const cached = localStorage.getItem(`dashboard-ai-insights-${user.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.insights)) {
              setAiInsights(parsed.insights);
            } else if (Array.isArray(parsed)) {
              // Backward compatibility if array was stored directly
              setAiInsights(parsed);
            }
          }
        } catch (e) {
          console.warn('Failed to load cached dashboard insights:', e);
        }

  const userTasks = await offlineFirebaseService.getTasks();
        console.log('Raw tasks from Firebase:', userTasks);
  // Store for future re-computation of insights when focus stats update
  lastUserTasksRef.current = userTasks;
        
        setTasks(userTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          status: task.completed ? 'completed' : 'pending',
          priority: task.priority || 'medium',
          createdAt: task.createdAt || new Date().toISOString(),
          completedAt: task.completedAt || null,
          due_date: task.due_date || task.dueDate
        })));
        
        console.log('Processed tasks:', userTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          status: task.completed ? 'completed' : 'pending',
          priority: task.priority || 'medium',
          due_date: task.due_date || task.dueDate
        })));
        
        // Load real activity data
        await loadUserActivity();
        
        // Calculate completion rate
        const totalCreated = userTasks.length;
        const totalCompleted = userTasks.filter((task: any) => task.completed).length;
        setCompletionRate(totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0);
        
        // Generate realistic AI insights based on user activity
  generateRealisticInsights(userTasks);
        
        const incompleteTasks = userTasks.filter((task: any) => !task.completed);
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

  // Re-generate insights when focus-related stats or mood change
  React.useEffect(() => {
    if (user && lastUserTasksRef.current && lastUserTasksRef.current.length > 0) {
      generateRealisticInsights(lastUserTasksRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTime, focusStreak, selectedMood]);

  // Load real user activity data
  const loadUserActivity = async () => {
    if (!user) return;
    
    try {
      // Get today's sessions
      const today = new Date().toISOString().split('T')[0];
      const sessions = await offlineFirebaseService.getPomodoroSessions(today);
      const completedSessions = sessions.filter((s: any) => s.completed);
      
      // Calculate real focus time and streak
      const todayFocusTime = completedSessions.reduce((total: number, session: any) => total + (session.duration || 25), 0);
      setFocusTime(todayFocusTime);
      
      // Get streak from last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];
        const daySessions = await offlineFirebaseService.getPomodoroSessions(dayStr);
        last7Days.push({
          date: dayStr,
          sessions: daySessions.filter((s: any) => s.completed).length,
          focusTime: daySessions.filter((s: any) => s.completed).reduce((total: number, s: any) => total + (s.duration || 25), 0)
        });
      }
      
      // Calculate streak
      let streak = 0;
      for (let i = last7Days.length - 1; i >= 0; i--) {
        if (last7Days[i].sessions > 0) streak++;
        else break;
      }
      setFocusStreak(streak);
      
      setUserActivity(last7Days);
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  // Generate realistic AI insights based on user behavior
  const generateRealisticInsights = (userTasks: any[]) => {
    const insights = [];
    
    // Calculate productivity metrics
    const completedTasks = userTasks.filter((task: any) => task.completed);
    const pendingTasks = userTasks.filter((task: any) => !task.completed);
    const highPriorityPending = pendingTasks.filter((task: any) => task.priority === 'high');
    
    // Morning productivity insight (based on completion times)
    const morningCompleted = completedTasks.filter((task: any) => {
      if (!task.completedAt) return false;
      const hour = new Date(task.completedAt).getHours();
      return hour >= 8 && hour < 12;
    });
    
    if (morningCompleted.length > 0) {
      insights.push({
        id: 'morning_productivity',
        title: 'Morning productivity peak',
        description: `You complete ${morningCompleted.length} tasks before noon. Schedule high-priority work in the morning for maximum efficiency.`,
        icon: 'TrendingUp',
        color: 'text-green-500',
        confidence: 'high',
        action: 'Schedule high-priority work in the morning',
        metrics: {
          morningTasks: morningCompleted.length,
          improvement: '+18%',
        }
      });
    }
    
    // Task switching pattern
    if (focusTime > 0) {
      insights.push({
        id: 'focus_blocks',
        title: 'Focused work sessions',
        description: `You've logged ${focusTime} minutes of focused work today. Your optimal focus duration is 25-minute blocks with short breaks.`,
        icon: 'Clock',
        color: 'text-indigo-500',
        confidence: 'medium',
        action: 'Try one more 25-min session',
        metrics: {
          focusTime: `${focusTime} min`,
          streak: `${focusStreak} days`,
        }
      });
    }
    
    // Task breakdown suggestion
    if (pendingTasks.some((task: any) => task.title.length > 40)) {
      insights.push({
        id: 'task_breakdown',
        title: 'Break down large tasks',
        description: 'Longer task descriptions tend to take 43% more time to complete. Try breaking complex tasks into smaller, actionable steps.',
        icon: 'SlidersHorizontal',
        color: 'text-yellow-500',
        confidence: 'medium',
        action: 'Split large tasks',
        metrics: {
          completionRate: '↑24%',
          timeReduction: '43%',
        }
      });
    }
    
    // High priority tasks
    if (highPriorityPending.length > 0) {
      insights.push({
        id: 'high_priority',
        title: 'High priority tasks',
        description: `You have ${highPriorityPending.length} high-priority tasks pending. Focus on these first to maximize productivity.`,
        icon: 'ArrowUp',
        color: 'text-red-500',
        confidence: 'high',
        action: 'Focus on high priority',
        metrics: {
          highPriorityCount: highPriorityPending.length,
          urgency: 'High',
        }
      });
    }
    
    // Consistency insight based on streak
    if (focusStreak > 0) {
      insights.push({
        id: 'consistency',
        title: 'Consistency streak',
        description: `You're on a ${focusStreak}-day productivity streak! Consistent daily sessions boost long-term productivity by 31%.`,
        icon: 'BarChart',
        color: 'text-green-500',
        confidence: 'high',
        action: 'Maintain your streak',
        metrics: {
          streak: `${focusStreak} days`,
          improvement: '+31%',
        }
      });
    }
    
    // Mood correlation (if mood is selected)
    if (selectedMood) {
      const moodEffects: Record<string, string> = {
        'great': 'Your productivity increases by 27% when you feel great',
        'okay': 'You maintain consistent output when feeling okay',
        'tired': 'Consider lighter tasks when tired - productivity drops 24%'
      };
      
      insights.push({
        id: 'mood_correlation',
        title: 'Mood and productivity',
        description: moodEffects[selectedMood] || 'Track your mood to see patterns in productivity',
        icon: 'Brain',
        color: selectedMood === 'great' ? 'text-green-500' : 
               selectedMood === 'okay' ? 'text-yellow-500' : 'text-red-500',
        confidence: 'medium',
        action: selectedMood === 'tired' ? 'Take a short break' : 'Maintain your rhythm',
        metrics: {
          currentMood: selectedMood,
          effect: selectedMood === 'great' ? '+27%' : 
                 selectedMood === 'okay' ? 'Stable' : '-24%',
        }
      });
    }
    
    // Only overwrite if we have something meaningful to show
    if (insights.length > 0) {
      setAiInsights(insights);
      // Persist insights so they survive page refreshes
      try {
        if (user) {
          localStorage.setItem(
            `dashboard-ai-insights-${user.id}`,
            JSON.stringify({ insights, lastUpdated: new Date().toISOString() })
          );
        }
      } catch (e) {
        console.warn('Failed to cache dashboard insights:', e);
      }
    }
  };

  const addTask = async () => {
    if (newTask.trim() && user) {
      try {
        const taskId = await offlineFirebaseService.addTask(newTask.trim());
        const newTaskObj = {
          id: taskId,
          title: newTask.trim(),
          status: 'pending',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          completedAt: null
        };
        setTasks(prev => [...prev, newTaskObj]);
        setNewTask('');
        setAiMessage(`Great! I added "${newTask}" to your tasks. Let's get it done!`);
        
        // Add to activity
        setUserActivity(prev => [{
          type: 'task_created',
          timestamp: new Date().toISOString(),
          taskTitle: newTask.trim()
        }, ...prev.slice(0, 9)]);
      } catch (error) {
        console.error('Error adding task:', error);
        setAiMessage('Sorry, there was an error adding that task. Please try again.');
      }
    }
  };

  const handleSmartTaskCreated = async (taskData: any) => {
    try {
      const taskId = await offlineFirebaseService.addTask(taskData.title, taskData.priority);
      const newTaskObj = {
        id: taskId,
        title: taskData.title,
        status: 'pending',
        priority: taskData.priority,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      setTasks(prev => [...prev, newTaskObj]);
      setAiMessage(`Smart task created! "${taskData.title}" has been added with AI insights.`);
      
      // Add to activity
      setUserActivity(prev => [{
        type: 'task_created',
        timestamp: new Date().toISOString(),
        taskTitle: taskData.title,
        isAiGenerated: true
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error creating smart task:', error);
      setAiMessage('Sorry, there was an error creating that task. Please try again.');
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newCompleted = task.status !== 'completed';
      await offlineFirebaseService.toggleTask(taskId);
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: newCompleted ? 'completed' : 'pending',
          completedAt: newCompleted ? new Date().toISOString() : null
        } : t
      ));
      
      // Add to activity
      setUserActivity(prev => [{
        type: newCompleted ? 'task_complete' : 'task_uncomplete',
        timestamp: new Date().toISOString(),
        taskTitle: task.title
      }, ...prev.slice(0, 9)]);
      
      setAiMessage(newCompleted 
        ? `Excellent! You completed "${task.title}". Keep up the great work!`
        : `Task "${task.title}" marked as pending. You can do it!`);
      
      // Update completion rate
      const totalCreated = tasks.length;
      const totalCompleted = tasks.filter(t => 
        (t.id === taskId ? newCompleted : t.status === 'completed')
      ).length;
      setCompletionRate(totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0);
      
      // Generate new insights based on the updated task list
      generateRealisticInsights(tasks.map(t => 
        t.id === taskId ? { 
          ...t, 
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : null
        } : t
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
      setAiMessage('Sorry, there was an error updating that task. Please try again.');
    }
  };
  
  // Filter tasks based on filter and search term
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      // Filter by status
      if (taskFilter === 'pending' && task.status !== 'pending') return false;
      if (taskFilter === 'completed' && task.status !== 'completed') return false;
      if (taskFilter === 'high' && task.priority !== 'high') return false;
      
      // Filter by search term
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [tasks, taskFilter, searchTerm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pomodoro timer functions
  const startPomodoro = React.useCallback(() => {
    setPomodoroActive(true);
  }, []);

  const pausePomodoro = React.useCallback(() => {
    setPomodoroActive(false);
    // Don't record paused/incomplete sessions
  }, []);

  const resetPomodoro = React.useCallback(() => {
    setPomodoroActive(false);
    setPomodoroTime(25 * 60);
  }, []);

  // Pomodoro timer tick effect
  React.useEffect(() => {
    if (!pomodoroActive) return;
    
    const id = setInterval(() => {
      setPomodoroTime(t => {
        if (t <= 1) {
          // Timer complete - save to Firebase
          clearInterval(id);
          setPomodoroActive(false);
          
          // Save completed session to Firebase
          if (user) {
            offlineFirebaseService.savePomodoroSession({
              userId: user.id,
              duration: 25,
              completed: true,
              startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              endTime: new Date().toISOString(),
              date: new Date().toISOString().split('T')[0]
            });
          }
          
          setFocusTime(prev => prev + 25);
          loadUserActivity(); // Refresh activity data
          
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(id);
  }, [pomodoroActive, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleAskAI = async () => {
    if (!aiChatInput.trim() || !user) return;
    
    setIsAiLoading(true);
    try {
      const incompleteTasks = tasks.filter(task => task.status === 'pending');
      const completedTasks = tasks.filter(task => task.status === 'completed');
      
      const responses = [
        `Based on your ${incompleteTasks.length} pending tasks, I suggest focusing on one at a time using the Pomodoro technique.`,
        `Great progress on completing ${completedTasks.length} tasks! Let's tackle the remaining ones step by step.`,
        `I see you're feeling ${selectedMood || 'focused'}. This is a good time to work on your priority tasks.`,
        `Try breaking down your larger tasks into smaller, manageable chunks for better productivity.`
      ];
      
      setAiMessage(responses[Math.floor(Math.random() * responses.length)]);
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
    
    setIsAiLoading(true);
    try {
      const incompleteTasks = tasks.filter(task => task.status === 'pending');
      const highPriorityTasks = incompleteTasks.filter(task => task.priority === 'high');
      
      const tips = [
        "Focus on one task at a time and take regular breaks!",
        "Try the 2-minute rule: If it takes less than 2 minutes, do it now!",
        "Break larger tasks into smaller, manageable chunks.",
        "Use the Pomodoro technique: 25 minutes focused work, 5 minute break.",
        "Tackle your most important task when your energy is highest.",
        "Remove distractions and create a dedicated workspace."
      ];
      
      let tipMessage;
      if (highPriorityTasks.length > 0) {
        tipMessage = `You have ${highPriorityTasks.length} high priority tasks. Focus on these first: ${highPriorityTasks.map(t => t.title).join(', ')}`;
      } else {
        tipMessage = tips[Math.floor(Math.random() * tips.length)];
      }
      
      setAiMessage(tipMessage);
      
      // Auto-save the tip
      // Auto-save the tip - removed for now
    } catch (error) {
      console.error('AI tip error:', error);
      const fallbackTip = "Here's a quick tip: Break your next task into smaller 15-minute chunks for better focus!";
      setAiMessage(fallbackTip);
      // Save fallback tip too
      try {
        // Save fallback tip - removed for now
      } catch (saveError) {
        console.error('Error saving fallback tip:', saveError);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

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

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'User';
  const greeting = getGreeting();
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  // Get upcoming deadlines from real task data
  const getUpcomingDeadlines = () => {
    console.log('All tasks:', tasks);
    // Use start-of-day and also a string comparator for YYYY-MM-DD to avoid timezone pitfalls
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const tasksWithDeadlines = tasks
      .filter(task => {
        console.log(`Task ${task.title}: due_date = ${task.due_date}, status = ${task.status}`);
        // Only include tasks with a deadline in the future and not completed
        if (!task.due_date || task.status === 'completed') return false;
        const raw = task.due_date as string;
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
        if (dateOnly) {
          // Lexicographical compare works for YYYY-MM-DD
          return raw >= todayStr;
        }
        const dueDate = new Date(raw);
        // Normalize to local start-of-day for comparison
        const dueStart = new Date(dueDate);
        dueStart.setHours(0, 0, 0, 0);
        return dueStart.getTime() >= todayStart.getTime();
      })
      .map(task => {
        const dueDate = new Date(task.due_date);
        const timeDiff = dueDate.getTime() - todayStart.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        return {
          id: task.id,
          title: task.title,
          deadline: formatDeadline(dueDate),
          priority: task.priority,
          daysLeft: daysLeft,
          dueDate: dueDate
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5); // Show only next 5 deadlines
    
    console.log('Tasks with deadlines:', tasksWithDeadlines);
    return tasksWithDeadlines;
  };
  
  const formatDeadline = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return date.toLocaleDateString([], options);
    }
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-8 py-6"
        >
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {greeting}, {firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Today's Progress</p>
                <motion.p 
                  className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
                  key={`${completedTasks}-${totalTasks}`}
                  initial={prefersReducedMotion ? { scale: 1 } : { scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {completedTasks}/{totalTasks}
                </motion.p>
                {/* Progress bar */}
                <div className="mt-2 w-40">
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                      style={{ width: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%` }}
                      aria-label={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% complete`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
                      role="progressbar"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-8 py-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Focus Time</p>
                <p className="font-semibold text-gray-800 dark:text-white">{focusTime} min</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                <p className="font-semibold text-gray-800 dark:text-white">{completionRate}%</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Streak</p>
                <p className="font-semibold text-gray-800 dark:text-white">{focusStreak} days</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                {selectedMood ? (
                  React.createElement(moods.find(m => m.id === selectedMood)?.icon || Smile, {
                    className: "w-5 h-5 text-yellow-600 dark:text-yellow-400"
                  })
                ) : (
                  <Smile className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Mood</p>
                <p className="font-semibold text-gray-800 dark:text-white capitalize">
                  {selectedMood || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="space-y-6 lg:col-span-2">
              {/* Smart Task Input */}
              <FloatingCard delay={0.1}>
                <SmartTaskInput 
                  onTaskCreated={handleSmartTaskCreated}
                  userId={user.id}
                />
              </FloatingCard>

              {/* Mini Pomodoro Timer */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.15}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Focus Timer</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pomodoro</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {formatTime(pomodoroTime)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {pomodoroActive 
                        ? 'Focus in progress' 
                        : pomodoroTime < 25 * 60 
                          ? 'Timer paused' 
                          : 'Ready to start'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {pomodoroActive ? (
                      <button
                        onClick={pausePomodoro}
                        className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                        aria-label="Pause timer"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={startPomodoro}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        aria-label="Start timer"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={resetPomodoro}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      aria-label="Reset timer"
                      title="Reset"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${100 - Math.round((pomodoroTime / (25 * 60)) * 100)}%` }}
                    aria-hidden="true"
                  />
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
                
                {/* Task filters and search */}
                <div className="mb-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTaskFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        taskFilter === 'all'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTaskFilter('pending')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        taskFilter === 'pending'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setTaskFilter('completed')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        taskFilter === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => setTaskFilter('high')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        taskFilter === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      High Priority
                    </button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
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
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  />
                  <motion.button
                    onClick={addTask}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Add task"
                    whileHover={prefersReducedMotion ? { scale: 1 } : { scale: 1.05 }}
                    whileTap={prefersReducedMotion ? { scale: 1 } : { scale: 0.95 }}
                  >
                    <Plus size={18} />
                  </motion.button>
                </motion.div>

                {filteredTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600"
                  >
                    {tasks.length === 0 ? (
                      <>
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                          <CheckSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">No tasks yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first task to get started!</p>
                        <button
                          onClick={() => (document.querySelector('input[placeholder="Add a new task..."]') as HTMLInputElement)?.focus()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
                        >
                          <Plus size={16} />
                          <span>Add Task</span>
                        </button>
                      </>
                    ) : searchTerm ? (
                      <>
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">No matching tasks</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Try a different search term</p>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                          <Filter className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">No {taskFilter} tasks</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Try a different filter</p>
                        <button
                          onClick={() => setTaskFilter('all')}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Show All Tasks
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <StaggeredList className="space-y-3" staggerDelay={0.05}>
                    {filteredTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          task.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        whileHover={prefersReducedMotion ? {} : { x: 5 }}
                        layout
                      >
                        <motion.button
                          onClick={() => toggleTask(task.id)}
                          className={`transition-colors ${
                          task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
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
                  ))}
                </StaggeredList>
                )}
              </FloatingCard>
            </div>

            <div className="space-y-6 lg:col-span-1">
              {/* AI Productivity Insights */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.3}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Productivity Insights</h3>
                
                {aiInsights.length === 0 ? (
                  <div className="text-center p-6">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                      <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">No insights yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete more tasks to generate personalized insights</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiInsights.slice(0, 3).map((insight) => (
                      <motion.div 
                        key={insight.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={prefersReducedMotion ? {} : { y: -2 }}
                      >
                        <div className="flex items-start space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            insight.color === 'text-green-500' ? 'bg-green-100 dark:bg-green-900/30' :
                            insight.color === 'text-indigo-500' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                            insight.color === 'text-yellow-500' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            insight.color === 'text-red-500' ? 'bg-red-100 dark:bg-red-900/30' :
                            'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {insight.icon === 'TrendingUp' ? <TrendingUp className={`w-5 h-5 ${insight.color}`} /> :
                             insight.icon === 'Clock' ? <Clock className={`w-5 h-5 ${insight.color}`} /> :
                             insight.icon === 'SlidersHorizontal' ? <SlidersHorizontal className={`w-5 h-5 ${insight.color}`} /> : 
                             insight.icon === 'ArrowUp' ? <ArrowUp className={`w-5 h-5 ${insight.color}`} /> :
                             insight.icon === 'BarChart' ? <BarChart className={`w-5 h-5 ${insight.color}`} /> :
                             insight.icon === 'Brain' ? <Brain className={`w-5 h-5 ${insight.color}`} /> :
                             <Lightbulb className={`w-5 h-5 ${insight.color}`} />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-gray-800 dark:text-white">{insight.title}</h4>
                              <div className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {insight.confidence}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex space-x-3">
                            {Object.entries(insight.metrics).map(([key, value], idx) => (
                              <div key={key} className="flex items-center space-x-1">
                                <span className="text-gray-500 dark:text-gray-400">{key}:</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                          <button className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1">
                            <span>{insight.action}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {aiInsights.length > 3 && (
                      <button className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline py-2">
                        Show more insights
                      </button>
                    )}
                  </div>
                )}
              </FloatingCard>

              {/* Mood Selector */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.4}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">How are you feeling?</h3>
                <StaggeredList className="grid grid-cols-3 gap-3" staggerDelay={0.08}>
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                        selectedMood === mood.id
                          ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-200 dark:ring-indigo-700'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      <mood.icon className={`w-8 h-8 mb-1 ${mood.color}`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{mood.label}</span>
                    </motion.button>
                  ))}
                </StaggeredList>
              </FloatingCard>
              
              {/* Upcoming Deadlines */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.5}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Upcoming Deadlines</h3>
                </div>
                
                <div className="space-y-3">
                  {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((task, index) => {
                    const getPriorityInfo = (priority: string) => {
                      switch (priority) {
                        case 'high':
                          return { 
                            color: 'border-red-500 bg-red-50 dark:bg-red-900/20', 
                            icon: '🔴', 
                            badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                            textColor: 'text-red-600 dark:text-red-400'
                          };
                        case 'medium':
                          return { 
                            color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20', 
                            icon: '🟡', 
                            badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                            textColor: 'text-orange-600 dark:text-orange-400'
                          };
                        default:
                          return { 
                            color: 'border-green-500 bg-green-50 dark:bg-green-900/20', 
                            icon: '🟢', 
                            badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                            textColor: 'text-green-600 dark:text-green-400'
                          };
                      }
                    };
                    
                    const priorityInfo = getPriorityInfo(task.priority);
                    const isUrgent = task.daysLeft <= 1;
                    
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          isUrgent ? priorityInfo.color : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{priorityInfo.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{task.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{task.deadline}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.badge}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                          </span>
                          {isUrgent && (
                            <AlertTriangle className={`w-4 h-4 ${priorityInfo.textColor}`} />
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Tasks with due dates will appear here
                      </p>
                    </div>
                  )}
                </div>
              </FloatingCard>
            </div>
          </div>
        </div>

        <FloatingAssistant
          isAiLoading={isAiLoading}
          aiMessage={aiMessage}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          onAskAI={handleAskAI}
          onGetTip={handleGetTip}
        />
      </div>
    </AnimatedPage>
  );
};

export default EnhancedDashboard;