import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Zap,
  CalendarDays
} from 'lucide-react';
import useResponsive from '../hooks/useResponsive';
import FocusMateAvatar from './FocusMateAvatar';

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Review project proposal', completed: false, priority: 'high' },
    { id: 2, title: 'Update client presentation', completed: true, priority: 'medium' },
    { id: 3, title: 'Prepare for team meeting', completed: false, priority: 'low' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moods = [
    { id: 'happy', icon: Smile, label: 'Energized', color: 'text-green-500' },
    { id: 'neutral', icon: Meh, label: 'Focused', color: 'text-yellow-500' },
    { id: 'sad', icon: Frown, label: 'Tired', color: 'text-red-500' },
  ];

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { 
        id: Date.now(), 
        title: newTask, 
        completed: false, 
        priority: 'medium' 
      }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const quickActions = [
    { icon: Play, label: 'Start Focus', action: () => navigate('/app/pomodoro'), color: 'bg-indigo-500' },
    { icon: Plus, label: 'Add Task', action: () => {}, color: 'bg-green-500' },
    { icon: BookOpen, label: 'Journal', action: () => navigate('/app/journal'), color: 'bg-purple-500' },
    { icon: TrendingUp, label: 'Stats', action: () => navigate('/app/stats'), color: 'bg-orange-500' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-6"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FocusMateAvatar size="lg" animated />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Good morning! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ready to make today productive?
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {tasks.filter(t => t.completed).length}/{tasks.length}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={action.action}
              className={`p-4 rounded-2xl ${action.color} text-white shadow-lg active:scale-95 transition-transform`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <action.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Pomodoro Timer Card */}
      <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Focus Timer
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {pomodoroActive ? 'Active' : 'Ready'}
          </span>
        </div>
        
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">
            {formatTime(pomodoroTime)}
          </div>
          
          <div className="flex justify-center space-x-3">
            <motion.button
              onClick={() => setPomodoroActive(!pomodoroActive)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                pomodoroActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {pomodoroActive ? (
                <>
                  <Pause className="h-5 w-5 mr-2 inline" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2 inline" />
                  Start
                </>
              )}
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/app/pomodoro')}
              className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
              whileTap={{ scale: 0.95 }}
            >
              Full Timer
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Today's Tasks */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Today's Tasks
          </h3>
          <motion.button
            onClick={() => navigate('/app/todos')}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center"
            whileTap={{ scale: 0.95 }}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </motion.button>
        </div>

        {/* Add Task Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <motion.button
            onClick={addTask}
            className="px-4 py-3 bg-indigo-500 text-white rounded-xl shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Task List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {tasks.slice(0, 5).map((task) => (
            <motion.div
              key={task.id}
              layout
              className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <motion.button
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {task.completed && <CheckCircle2 className="h-4 w-4" />}
              </motion.button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  task.completed
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-900 dark:text-white'
                } truncate`}>
                  {task.title}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {task.priority} priority
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mood Check-in */}
      <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Smile className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          How are you feeling?
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {moods.map((mood) => (
            <motion.button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedMood === mood.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <mood.icon className={`h-8 w-8 ${mood.color}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {mood.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* AI Assistant Preview */}
      <motion.div variants={item} className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Brain className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-semibold">AI Assistant</h3>
          </div>
          <Lightbulb className="h-5 w-5 opacity-80" />
        </div>
        
        <p className="text-white/90 mb-4 text-sm leading-relaxed">
          "Based on your recent patterns, I suggest starting with your high-priority task 'Review project proposal' during your next focus session."
        </p>
        
        <motion.button
          onClick={() => navigate('/app/ai-chat')}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center"
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat with AI
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default MobileDashboard;
