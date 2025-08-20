import * as React from 'react';
import { useTodos, Todo } from '../hooks/useTodos';
import { useTheme } from '../context/ThemeContext';
import { useAI } from '../hooks/useAI';
import { 
  Bell, 
  Calendar, 
  List, 
  Filter, 
  Mic, 
  Flame, 
  Trophy, 
  Lightbulb,
  Grip,
  Star,
  Clock,
  Target,
  Zap,
  Split,
  Plus
} from 'lucide-react';
import taskNotificationService from '../services/TaskNotificationService';
import NotificationSettings from './NotificationSettings';
import { taskAnalysisService } from '../services/TaskAnalysisService';

// Enhanced TodoManager with new features
export default function TodoManager() {
  const { todos, loading, error: todoError, addTodo, toggleTodo, deleteTodo, updateTodo, refreshTodos } = useTodos();
  const { darkMode } = useTheme();
  const { chat, isLoading: aiLoading } = useAI();
  
  // Basic state
  const [newTask, setNewTask] = React.useState('');
  const [error, setError] = React.useState<string | null>(todoError);
  const [showNotificationSettings, setShowNotificationSettings] = React.useState(false);
  const [scheduledTime, setScheduledTime] = React.useState('');
  
  // New feature states
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');
  const [groupBy, setGroupBy] = React.useState<'none' | 'priority' | 'category' | 'due_date'>('none');
  const [sortBy, setSortBy] = React.useState<'created' | 'priority' | 'due_date'>('created');
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [draggedTask, setDraggedTask] = React.useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = React.useState<any[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = React.useState(false);
  const [streaks, setStreaks] = React.useState<{[key: string]: number}>({});
  const [badges, setBadges] = React.useState<string[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const [taskCategories] = React.useState(['Work', 'Personal', 'Health', 'Learning', 'Shopping']);
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedPriority, setSelectedPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  
  // Update local error state when the hook's error changes
  React.useEffect(() => {
    setError(todoError);
  }, [todoError]);

  // Generate AI suggestions for tasks using real AI analysis
  const generateAiSuggestions = React.useCallback(async () => {
    if (todos.length === 0) return;
    
    try {
      const incompleteTasks = todos.filter(t => !t.completed);
      if (incompleteTasks.length === 0) return;

      const suggestions = [];

      // Analyze tasks with real AI service
      for (const task of incompleteTasks.slice(0, 3)) {
        try {
          const analysis = await taskAnalysisService.analyzeTask(task.title, task.description);
          const taskSuggestions = [];
          
          // Convert AI suggestions to UI format
          analysis.suggestions.forEach((suggestion, index) => {
            let suggestionType = 'general';
            let icon = Lightbulb;
            
            if (suggestion.toLowerCase().includes('break') || suggestion.toLowerCase().includes('split')) {
              suggestionType = 'split';
              icon = Split;
            } else if (suggestion.toLowerCase().includes('schedule') || suggestion.toLowerCase().includes('time')) {
              suggestionType = 'schedule';
              icon = Clock;
            } else if (suggestion.toLowerCase().includes('priority') || suggestion.toLowerCase().includes('urgent')) {
              suggestionType = 'priority';
              icon = Zap;
            }
            
            taskSuggestions.push({
              type: suggestionType,
              icon: icon,
              text: suggestion,
              reason: `AI analyzed complexity: ${analysis.complexity}/10, estimated ${analysis.estimatedDuration}min`
            });
          });
          
          // Add priority suggestion if AI suggests different priority
          if (analysis.priority !== task.priority) {
            taskSuggestions.push({
              type: 'priority',
              icon: Zap,
              text: `Change priority to ${analysis.priority}`,
              reason: `AI recommends ${analysis.priority} priority based on task analysis`
            });
          }
          
          if (taskSuggestions.length > 0) {
            suggestions.push({
              taskId: task.id,
              taskTitle: task.title,
              suggestions: taskSuggestions.slice(0, 2) // Limit to 2 suggestions per task
            });
          }
        } catch (error) {
          console.error('AI analysis error for task:', task.title, error);
        }
      }

      setAiSuggestions(suggestions);
      if (suggestions.length > 0) {
        setShowAiSuggestions(true);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  }, [todos]);

  // Voice input support
  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewTask(transcript);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        setError('Voice recognition failed. Please try again.');
      };
      
      recognition.start();
    } else {
      setError('Voice recognition not supported in this browser.');
    }
  };

  // Calculate streaks
  const calculateStreaks = React.useCallback(() => {
    const newStreaks: {[key: string]: number} = {};
    const today = new Date().toDateString();
    
    todos.forEach(todo => {
      if (todo.completed && new Date(todo.updated_at).toDateString() === today) {
        const category = selectedCategory || 'general';
        newStreaks[category] = (newStreaks[category] || 0) + 1;
      }
    });
    
    setStreaks(newStreaks);
  }, [todos, selectedCategory]);

  // Check for new badges
  const checkBadges = React.useCallback(() => {
    const newBadges = [...badges];
    const completedToday = todos.filter(t => 
      t.completed && 
      new Date(t.updated_at).toDateString() === new Date().toDateString()
    ).length;

    if (completedToday >= 5 && !badges.includes('productive-day')) {
      newBadges.push('productive-day');
    }
    
    if (todos.filter(t => t.completed).length >= 50 && !badges.includes('task-master')) {
      newBadges.push('task-master');
    }

    setBadges(newBadges);
  }, [todos, badges]);

  // Only calculate streaks and badges when todos change, not AI suggestions
  // AI suggestions are now opt-in to avoid automatic token consumption
  React.useEffect(() => {
    calculateStreaks();
    checkBadges();
  }, [todos, calculateStreaks, checkBadges]);
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;

    const draggedIndex = todos.findIndex(t => t.id === draggedTask);
    const targetIndex = todos.findIndex(t => t.id === targetTaskId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder tasks (this would need backend support for persistence)
    const newTodos = [...todos];
    const [removed] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(targetIndex, 0, removed);
    
    setDraggedTask(null);
  };

  // Filter and sort todos
  const getFilteredAndSortedTodos = () => {
    let filtered = showCompleted ? todos : todos.filter(t => !t.completed);
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Group
    if (groupBy === 'none') return { 'All Tasks': filtered };
    
    const grouped: {[key: string]: Todo[]} = {};
    
    filtered.forEach(todo => {
      let key = 'Other';
      switch (groupBy) {
        case 'priority':
          key = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
          break;
        case 'due_date':
          if (!todo.due_date) {
            key = 'No Due Date';
          } else {
            const dueDate = new Date(todo.due_date);
            const today = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) key = 'Overdue';
            else if (diffDays === 0) key = 'Due Today';
            else if (diffDays === 1) key = 'Due Tomorrow';
            else if (diffDays <= 7) key = 'This Week';
            else key = 'Later';
          }
          break;
        case 'category':
          key = selectedCategory || 'Uncategorized';
          break;
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(todo);
    });

    return grouped;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      const newTodo = {
        title: newTask.trim(),
        completed: false,
        priority: selectedPriority,
        due_date: scheduledTime || undefined,
        description: selectedCategory ? `Category: ${selectedCategory}` : undefined
      };
      
      addTodo(newTodo);
      
      // Schedule notifications if due date is set
      if (scheduledTime) {
        const mockTask = {
          id: Date.now().toString(), // temporary ID
          title: newTask.trim(),
          due_date: scheduledTime,
          completed: false,
          priority: 'medium' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'temp-user'
        };
        
        taskNotificationService.scheduleTaskDueNotification(mockTask);
        
        // Also schedule a reminder notification
        const reminderTime = new Date(new Date(scheduledTime).getTime() - 15 * 60 * 1000); // 15 minutes before
        if (reminderTime > new Date()) {
          taskNotificationService.scheduleTaskReminder(mockTask, reminderTime);
        }
      }
      
      setNewTask('');
      setScheduledTime('');
      setSelectedCategory('');
      setSelectedPriority('medium');
    }
  };

  // Handle task completion
  const handleToggleTask = (todo: Todo) => {
    toggleTodo(todo.id);
    
    // Cancel notifications for completed tasks
    if (!todo.completed) {
      taskNotificationService.cancelTaskNotifications(todo.id);
    }
  };

  // Handle AI suggestion actions
  const handleAiSuggestion = async (taskId: string, suggestionType: string) => {
    const task = todos.find(t => t.id === taskId);
    if (!task) return;

    try {
      switch (suggestionType) {
        case 'split':
          const splitSuggestion = await chat(
            `Break down this task into 2-3 smaller, actionable subtasks: "${task.title}". 
            Respond with just the subtasks, one per line, starting with "- ".`,
            'task_splitting'
          );
          
          // Add the subtasks as new todos
          const subtasks = splitSuggestion.split('\n')
            .filter(line => line.trim().startsWith('- '))
            .map(line => line.replace('- ', '').trim());
          
          for (const subtask of subtasks) {
            if (subtask) {
              await addTodo({
                title: subtask,
                completed: false,
                priority: task.priority,
                due_date: task.due_date
              });
            }
          }
          
          // Mark original task as completed
          await toggleTodo(taskId);
          break;
          
        case 'schedule':
          // Set due date to tomorrow at 9 AM as a smart default
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          
          await updateTodo(taskId, {
            due_date: tomorrow.toISOString()
          });
          break;
          
        case 'priority':
          const newPriority = task.priority === 'low' ? 'medium' : 
                             task.priority === 'medium' ? 'high' : 'high';
          await updateTodo(taskId, { priority: newPriority });
          break;
      }
      
      // Remove the suggestion after action
      setAiSuggestions(prev => 
        prev.filter(s => s.taskId !== taskId || 
          !s.suggestions.some((sug: any) => sug.type === suggestionType))
      );
      
    } catch (error) {
      console.error('Error handling AI suggestion:', error);
      setError('Failed to apply AI suggestion. Please try again.');
    }
  };

  const groupedTodos = getFilteredAndSortedTodos();
  const completedToday = todos.filter(t => 
    t.completed && 
    new Date(t.updated_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mx-4">
      {/* Header with badges and streaks */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Todo List</h2>
          
          {/* Streak indicator */}
          {completedToday > 0 && (
            <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {completedToday} today
              </span>
            </div>
          )}
          
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                {badges.length} badge{badges.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' 
                ? 'bg-white dark:bg-gray-600 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-1 rounded ${viewMode === 'calendar' 
                ? 'bg-white dark:bg-gray-600 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => setShowNotificationSettings(true)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Notification Settings"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* AI Suggestions Panel */}
      {showAiSuggestions && aiSuggestions.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">AI Suggestions</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAiSuggestions(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.taskId} className="bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {suggestion.taskTitle.length > 50 
                    ? `${suggestion.taskTitle.substring(0, 50)}...` 
                    : suggestion.taskTitle}
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.suggestions.map((sug: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAiSuggestion(suggestion.taskId, sug.type)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title={sug.reason}
                    >
                      <sug.icon className="w-3 h-3" />
                      <span>{sug.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
          {error}
          <button 
            type="button"
            className="ml-2 text-red-500 font-bold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Enhanced Add todo form */}
      <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-grow relative">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task... (try voice input!)"
              aria-label="New task"
              className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              list="task-suggestions"
            />
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={isListening}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                isListening 
                  ? 'text-red-500 animate-pulse' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
            
            {/* Autocomplete suggestions */}
            <datalist id="task-suggestions">
              <option value="Review project documentation" />
              <option value="Schedule team meeting" />
              <option value="Update task priorities" />
              <option value="Complete code review" />
              <option value="Plan weekly goals" />
            </datalist>
          </div>
          
          <button 
            type="submit"
            disabled={!newTask.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        
        {/* Enhanced task options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category selection */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full p-2 text-sm border rounded-lg ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="">No category</option>
              {taskCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Priority selection */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as 'low' | 'medium' | 'high')}
              className={`w-full p-2 text-sm border rounded-lg ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          {/* Due date */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Due date
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={`w-full p-2 text-sm border rounded-lg ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
        </div>
      </form>
      
      {/* Filtering and Sorting Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* Group by */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className={`text-sm border rounded px-2 py-1 ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="none">No grouping</option>
              <option value="priority">Group by priority</option>
              <option value="due_date">Group by due date</option>
              <option value="category">Group by category</option>
            </select>
          </div>
          
          {/* Sort by */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`text-sm border rounded px-2 py-1 ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="created">Date created</option>
              <option value="priority">Priority</option>
              <option value="due_date">Due date</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Show completed toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
              Show completed
            </span>
          </label>
          
          {/* AI suggestions generator */}
          <button
            type="button"
            onClick={async () => {
              if (showAiSuggestions) {
                setShowAiSuggestions(false);
              } else {
                await generateAiSuggestions();
              }
            }}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
              showAiSuggestions 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            disabled={aiLoading}
          >
            <Lightbulb className="w-3 h-3" />
            <span>{aiLoading ? 'Generating...' : showAiSuggestions ? 'Hide Tips' : 'Get AI Tips'}</span>
          </button>
        </div>
      </div>
      
      {/* Todo list */}
      {loading ? (
        <div className="text-center py-8 text-gray-900 dark:text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading tasks...</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-2">Ready to be productive?</p>
          <p className="text-sm">Add your first task above to get started!</p>
          <div className="mt-4 text-xs text-gray-400">
            💡 Tip: Try using voice input or set priorities for better organization
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTodos).map(([groupName, groupTodos]) => (
            <div key={groupName}>
              {groupBy !== 'none' && (
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  {groupName}
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {groupTodos.length}
                  </span>
                </h3>
              )}
              
              <div className="space-y-2">
                {groupTodos.map((todo) => (
                  <div
                    key={todo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, todo.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, todo.id)}
                    className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:shadow-md transition-all duration-200 ${
                      draggedTask === todo.id ? 'opacity-50' : ''
                    } ${todo.completed ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-grow">
                        {/* Drag handle */}
                        <div className="mr-2 mt-1 cursor-move text-gray-400 hover:text-gray-600">
                          <Grip className="w-4 h-4" />
                        </div>
                        
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTask(todo)}
                          className="mr-3 mt-1"
                          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                        />
                        
                        <div className="flex-grow">
                          {/* Task title */}
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`font-medium ${
                              todo.completed 
                                ? 'line-through text-gray-500 dark:text-gray-400' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {todo.title}
                            </span>
                            
                            {/* Priority indicator */}
                            <div className={`w-2 h-2 rounded-full ${
                              todo.priority === 'high' ? 'bg-red-500' :
                              todo.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`} title={`${todo.priority} priority`} />
                          </div>
                          
                          {/* Task metadata */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            {todo.due_date && (
                              <div className={`flex items-center space-x-1 ${
                                new Date(todo.due_date) < new Date() && !todo.completed
                                  ? 'text-red-500 font-medium'
                                  : ''
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(todo.due_date) < new Date() && !todo.completed ? 'Overdue: ' : 'Due: '}
                                  {new Date(todo.due_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            
                            {todo.description?.includes('Category:') && (
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span>{todo.description.replace('Category: ', '')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!todo.completed && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPriority = todo.priority === 'low' ? 'medium' : 
                                               todo.priority === 'medium' ? 'high' : 'low';
                              updateTodo(todo.id, { priority: newPriority });
                            }}
                            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                            title="Change priority"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Delete task "${todo.title}"`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming Tasks
          </h3>
          
          <div className="space-y-3">
            {todos
              .filter(t => t.due_date && !t.completed)
              .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
              .slice(0, 5)
              .map(todo => {
                const dueDate = new Date(todo.due_date!);
                const today = new Date();
                const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={todo.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{todo.title}</div>
                      <div className={`text-sm ${
                        diffDays < 0 ? 'text-red-500' :
                        diffDays === 0 ? 'text-orange-500' :
                        diffDays <= 3 ? 'text-yellow-500' : 'text-gray-500'
                      }`}>
                        {diffDays < 0 ? `${Math.abs(diffDays)} days overdue` :
                         diffDays === 0 ? 'Due today' :
                         diffDays === 1 ? 'Due tomorrow' :
                         `Due in ${diffDays} days`}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      todo.priority === 'high' ? 'bg-red-500' :
                      todo.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                  </div>
                );
              })}
            
            {todos.filter(t => t.due_date && !t.completed).length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No upcoming deadlines
              </div>
            )}
          </div>
        </div>
      )}

      {/* Motivational section for empty state */}
      {todos.length === 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg text-center">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-sm text-gray-600 dark:text-gray-300 italic">
            "The secret of getting ahead is getting started." - Mark Twain
          </p>
        </div>
      )}
      
      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}
    </div>
  );
}
