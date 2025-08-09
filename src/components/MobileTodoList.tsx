import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Search,
  Filter,
  Star,
  Clock,
  Flag,
  Calendar,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Target,
  X
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  starred: boolean;
  createdAt: Date;
}

const MobileTodoList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 1, 
      title: 'Review project proposal', 
      description: 'Check the new client requirements and update accordingly',
      completed: false, 
      priority: 'high',
      dueDate: '2024-01-15',
      category: 'Work',
      starred: true,
      createdAt: new Date()
    },
    { 
      id: 2, 
      title: 'Complete workout session', 
      completed: true, 
      priority: 'medium',
      category: 'Health',
      starred: false,
      createdAt: new Date()
    },
    { 
      id: 3, 
      title: 'Buy groceries', 
      description: 'Milk, eggs, bread, fruits',
      completed: false, 
      priority: 'low',
      category: 'Personal',
      starred: false,
      createdAt: new Date()
    },
  ]);
  
  const [newTask, setNewTask] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'starred'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const priorities = [
    { value: 'high', label: 'High', color: 'bg-red-500', textColor: 'text-red-600' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'bg-green-500', textColor: 'text-green-600' },
  ];

  const categories = ['Work', 'Personal', 'Health', 'Learning', 'Shopping'];

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now(),
        title: newTask,
        completed: false,
        priority: 'medium',
        starred: false,
        createdAt: new Date()
      };
      setTasks([task, ...tasks]);
      setNewTask('');
      setShowAddForm(false);
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleStar = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, starred: !task.starred } : task
    ));
  };

  const updateTaskPriority = (id: number, priority: 'low' | 'medium' | 'high') => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, priority } : task
    ));
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'pending') return !task.completed;
      if (filter === 'completed') return task.completed;
      if (filter === 'starred') return task.starred;
      return true;
    })
    .filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortBy === 'dueDate' && a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Stats */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-4"
      >
        <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
          <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
        </motion.div>
        
        <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
          <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </motion.div>
        
        <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Done</div>
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg space-y-3"
            >
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'completed', 'starred'] as const).map((filterOption) => (
                  <motion.button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </motion.button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                  aria-label="Sort tasks by"
                >
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                  <option value="created">Created</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add Task Button */}
      <motion.div variants={item}>
        <motion.button
          onClick={() => setShowAddForm(true)}
          className="w-full p-4 bg-indigo-500 text-white rounded-xl shadow-lg font-medium flex items-center justify-center space-x-2"
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-5 w-5" />
          <span>Add New Task</span>
        </motion.button>
      </motion.div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Task</h3>
                <motion.button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
              
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mb-4"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                autoFocus
              />
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={addTask}
                  className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  Add Task
                </motion.button>
                <motion.button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <motion.div variants={item} className="space-y-3">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <motion.button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {task.completed && <CheckCircle2 className="h-4 w-4" />}
                </motion.button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${
                        task.completed
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </p>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          priorities.find(p => p.value === task.priority)?.textColor
                        } bg-opacity-10`}>
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </span>
                        
                        {task.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">
                            {task.category}
                          </span>
                        )}
                        
                        {task.dueDate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <motion.button
                        onClick={() => toggleStar(task.id)}
                        className={`p-2 rounded-lg ${
                          task.starred
                            ? 'text-yellow-500'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Star className={`h-4 w-4 ${task.starred ? 'fill-current' : ''}`} />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
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
            <Target className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search or filters'
                : 'Add your first task to get started!'
              }
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MobileTodoList;
