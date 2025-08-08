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
  Loader,
  RefreshCw
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import FloatingCard from '../components/FloatingCard';
import StaggeredList from '../components/StaggeredList';
import FloatingAssistant from '../components/FloatingAssistant';
import SmartTaskInput from '../components/SmartTaskInput';
import ProductivityInsights from '../components/ProductivityInsights';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/FirebaseService';

const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [newTask, setNewTask] = React.useState('');
  const [pomodoroActive, setPomodoroActive] = React.useState(false);
  const [pomodoroTime, setPomodoroTime] = React.useState(25 * 60);
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);
  
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
        const userTasks = await firebaseService.getTasks();
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
        const taskId = await firebaseService.addTask(newTask.trim());
        const newTaskObj = {
          id: taskId,
          title: newTask.trim(),
          status: 'pending',
          priority: 'medium'
        };
        setTasks(prev => [...prev, newTaskObj]);
        setNewTask('');
        setAiMessage(`Great! I added "${newTask}" to your tasks. Let's get it done!`);
      } catch (error) {
        console.error('Error adding task:', error);
        setAiMessage('Sorry, there was an error adding that task. Please try again.');
      }
    }
  };

  const handleSmartTaskCreated = async (taskData: any) => {
    try {
      const taskId = await firebaseService.addTask(taskData.title, taskData.priority);
      const newTaskObj = {
        id: taskId,
        title: taskData.title,
        status: 'pending',
        priority: taskData.priority
      };
      setTasks(prev => [...prev, newTaskObj]);
      setAiMessage(`Smart task created! "${taskData.title}" has been added with AI insights.`);
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
      await firebaseService.toggleTask(taskId);
      
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
      
      if (highPriorityTasks.length > 0) {
        setAiMessage(`You have ${highPriorityTasks.length} high priority tasks. Focus on these first: ${highPriorityTasks.map(t => t.title).join(', ')}`);
      } else {
        setAiMessage(tips[Math.floor(Math.random() * tips.length)]);
      }
    } catch (error) {
      console.error('AI tip error:', error);
      setAiMessage("Here's a quick tip: Break your next task into smaller 15-minute chunks for better focus!");
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

        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            
            <div className="space-y-6">
              {/* Smart Task Input */}
              <FloatingCard delay={0.1}>
                <SmartTaskInput 
                  onTaskCreated={handleSmartTaskCreated}
                  userId={user.id}
                />
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
            </div>

            <div className="space-y-6">
              {/* AI Productivity Insights */}
              <FloatingCard delay={0.3}>
                <ProductivityInsights 
                  tasks={tasks}
                  sessions={sessions}
                />
              </FloatingCard>

              {/* Mood Selector */}
              <FloatingCard 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
                delay={0.4}
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