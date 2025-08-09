import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Flag, 
  Repeat, 
  Brain, 
  Trash2, 
  Edit3,
  CheckCircle2,
  Circle,
  AlertCircle,
  Target,
  Zap,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/FirebaseService';
import MobileTodoList from '../components/MobileTodoList';
import useResponsive from '../hooks/useResponsive';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | 'custom';
  category?: string;
  aiSuggestions?: string[];
  streak?: number;
  isHabit?: boolean;
  createdAt: string;
  updatedAt: string;
}

const EnhancedTodoList: React.FC = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();

  // Use mobile-optimized component for mobile devices
  if (isMobile) {
    return <MobileTodoList />;
  }

  // Use desktop component
  return <EnhancedTodoListDesktop user={user} />;
};

// Desktop todo list component
const EnhancedTodoListDesktop: React.FC<{ user: any }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userTasks = await firebaseService.getTasks();
      setTasks(userTasks.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        priority: task.priority || 'medium',
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        dueDate: task.due_date,
        description: task.description,
        category: task.category,
        recurring: task.recurring,
        isHabit: task.isHabit,
        streak: task.streak || 0,
        aiSuggestions: task.aiSuggestions || []
      })));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseNaturalLanguage = (input: string) => {
    const task: Partial<Task> = { title: input };
    
    // Extract priority
    if (input.toLowerCase().includes('urgent') || input.toLowerCase().includes('important')) {
      task.priority = 'high';
    } else if (input.toLowerCase().includes('low priority')) {
      task.priority = 'low';
    } else {
      task.priority = 'medium';
    }
    
    // Extract due date patterns
    const datePatterns = [
      /tomorrow/i,
      /today/i,
      /next week/i,
      /(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
    ];
    
    datePatterns.forEach(pattern => {
      if (pattern.test(input)) {
        const match = input.match(pattern);
        if (match) {
          if (match[0].toLowerCase() === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.dueDate = tomorrow.toISOString().split('T')[0];
          } else if (match[0].toLowerCase() === 'today') {
            task.dueDate = new Date().toISOString().split('T')[0];
          }
        }
      }
    });
    
    // Clean title by removing parsed elements
    task.title = input
      .replace(/\b(urgent|important|low priority|tomorrow|today|next week)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return task;
  };

  const generateAISuggestions = (taskTitle: string): string[] => {
    const suggestions = [];
    
    if (taskTitle.toLowerCase().includes('project')) {
      suggestions.push('Break into smaller subtasks', 'Set milestone deadlines', 'Assign team members');
    }
    
    if (taskTitle.toLowerCase().includes('meeting')) {
      suggestions.push('Prepare agenda', 'Send calendar invite', 'Book meeting room');
    }
    
    if (taskTitle.toLowerCase().includes('email')) {
      suggestions.push('Draft key points first', 'Schedule for optimal send time', 'Follow up in 3 days');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Set a specific deadline', 'Break into smaller steps', 'Estimate time needed');
    }
    
    return suggestions;
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    
    try {
      const parsedTask = parseNaturalLanguage(newTask);
      const aiSuggestions = generateAISuggestions(parsedTask.title || newTask);
      
      const taskData = {
        ...parsedTask,
        aiSuggestions,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const taskId = await firebaseService.addTask(taskData.title!, taskData.priority!);
      
      const newTaskObj: Task = {
        id: typeof taskId === 'string' ? taskId : taskId.id,
        title: taskData.title!,
        completed: false,
        priority: taskData.priority!,
        dueDate: taskData.dueDate,
        aiSuggestions,
        createdAt: taskData.createdAt,
        updatedAt: taskData.updatedAt,
        streak: 0
      };
      
      setTasks(prev => [newTaskObj, ...prev]);
      setNewTask('');
      setShowAISuggestions(true);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      await firebaseService.toggleTask(taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
          : task
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await firebaseService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Flag className="w-4 h-4" />;
      case 'low': return <Circle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'today':
        return matchesSearch && task.dueDate === new Date().toISOString().split('T')[0];
      case 'upcoming':
        return matchesSearch && !task.completed && task.dueDate;
      case 'completed':
        return matchesSearch && task.completed;
      default:
        return matchesSearch;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Todo List
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered task management with natural language input
          </p>
        </motion.div>

        {/* Add Task Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Try: 'Call John tomorrow at 3pm' or 'Urgent: Finish project proposal'"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
            </div>
            <motion.button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Brain className="w-5 h-5" />
              Add Smart Task
            </motion.button>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex gap-2 flex-wrap">
            {['all', 'today', 'upcoming', 'completed'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 ${
                  task.completed 
                    ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10' 
                    : isOverdue(task.dueDate)
                    ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <motion.button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-1 transition-colors ${
                      task.completed 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </motion.button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-medium ${
                        task.completed 
                          ? 'line-through text-gray-500 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>
                      
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)}
                        {task.priority}
                      </div>
                      
                      {task.isHabit && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                          <Repeat className="w-3 h-3" />
                          {task.streak || 0} day streak
                        </div>
                      )}
                    </div>
                    
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-sm mb-2 ${
                        isOverdue(task.dueDate) 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate) && <span className="font-medium">(Overdue)</span>}
                      </div>
                    )}
                    
                    {task.aiSuggestions && task.aiSuggestions.length > 0 && (
                      <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">AI Suggestions</span>
                        </div>
                        <ul className="space-y-1">
                          {task.aiSuggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-indigo-600 dark:text-indigo-300">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredTasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first task using natural language like "Call John tomorrow"'
                }
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedTodoList;