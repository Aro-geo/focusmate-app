import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Flag,
  Repeat,
  Brain,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Target,
  Zap,
  Search,
  Bell,
  List,
  Mic,
  Flame,
  Trophy,
  Lightbulb,
  Grip,
  Star,
  Split,
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAI } from '../hooks/useAI';
import { firebaseService } from '../services/FirebaseService';
import MobileTodoList from '../components/MobileTodoList';
import useResponsive from '../hooks/useResponsive';
import aiService from '../services/AIService';
import taskNotificationService from '../services/TaskNotificationService';
import NotificationSettings from '../components/NotificationSettings';

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
  const { darkMode } = useTheme();
  const { chat, isLoading: aiLoading } = useAI();

  // Basic state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // New feature states
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [groupBy, setGroupBy] = useState<'none' | 'priority' | 'category' | 'due_date'>('none');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'due_date'>('created');
  const [showCompleted, setShowCompleted] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<{ [key: string]: number }>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [taskCategories] = useState(['Work', 'Personal', 'Health', 'Learning', 'Shopping']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [user]);

  // Generate AI suggestions for tasks using only the stable chat() function
  const generateAiSuggestions = React.useCallback(async () => {
    if (tasks.length === 0) return;

    try {
      const incompleteTasks = tasks.filter(t => !t.completed);
      if (incompleteTasks.length === 0) return;

      const suggestions = [];

      // Process top 3 incomplete tasks for suggestions using only chat() function
      const topTasks = incompleteTasks
        .sort((a, b) => {
          // Sort by priority first, then by due date
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;

          // If same priority, sort by due date (sooner first)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        })
        .slice(0, 3);

      for (const task of topTasks) {
        const taskSuggestions = [];

        // Use only the stable chat() function for AI suggestions
        try {
          const aiResponse = await chat(
            `Analyze this task and provide 1-2 specific, actionable suggestions: "${task.title}". 
            Current priority: ${task.priority}. 
            Due date: ${task.dueDate || 'not set'}. 
            
            Consider suggesting:
            - Split if task seems complex or large
            - Schedule if no due date is set
            - Priority change if urgency doesn't match priority
            - Time blocking or focus techniques
            
            Respond with suggestions in this format:
            SUGGESTION_TYPE: Brief suggestion text | Reason
            
            Example:
            SPLIT: Break into smaller steps | Complex tasks are easier to complete
            SCHEDULE: Set deadline for tomorrow | Tasks with deadlines get done faster`,
            `task_analysis_${task.id}`
          );

          // Parse AI response to extract suggestions
          const lines = aiResponse.split('\n').filter(line => line.includes(':') && line.includes('|'));

          for (const line of lines.slice(0, 2)) { // Max 2 suggestions per task
            const [typeAndText, reason] = line.split('|').map(s => s.trim());
            const [type, text] = typeAndText.split(':').map(s => s.trim());

            let suggestionType = 'general';
            let icon = Lightbulb;

            // Map AI suggestion types to our action types
            if (type.toLowerCase().includes('split')) {
              suggestionType = 'split';
              icon = Split;
            } else if (type.toLowerCase().includes('schedule')) {
              suggestionType = 'schedule';
              icon = Clock;
            } else if (type.toLowerCase().includes('priority')) {
              suggestionType = 'priority';
              icon = Zap;
            }

            taskSuggestions.push({
              type: suggestionType,
              icon: icon,
              text: text || 'Improve task',
              reason: reason || 'AI recommendation'
            });
          }
        } catch (aiError) {
          console.error('Error getting AI suggestions for task:', aiError);

          // Fallback to rule-based suggestions if AI fails
          if (task.title.length > 50) {
            taskSuggestions.push({
              type: 'split',
              icon: Split,
              text: 'Split task',
              reason: 'Large tasks are easier when broken down'
            });
          }

          if (!task.dueDate) {
            taskSuggestions.push({
              type: 'schedule',
              icon: Clock,
              text: 'Schedule',
              reason: 'Tasks with deadlines get done faster'
            });
          }

          if (task.priority === 'low' && task.title.toLowerCase().includes('urgent')) {
            taskSuggestions.push({
              type: 'priority',
              icon: Zap,
              text: 'Increase priority',
              reason: 'Task seems urgent based on content'
            });
          }
        }

        if (taskSuggestions.length > 0) {
          suggestions.push({
            taskId: task.id,
            taskTitle: task.title,
            suggestions: taskSuggestions
          });
        }
      }

      setAiSuggestions(suggestions);
      setShowAISuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);

      // Fallback to intelligent rule-based suggestions if AI fails
      const incompleteTasks = tasks.filter(t => !t.completed);
      const basicSuggestions = [];

      for (const task of incompleteTasks.slice(0, 3)) {
        const taskSuggestions = [];

        // Smart fallback suggestions based on task analysis
        if (!task.dueDate) {
          taskSuggestions.push({
            type: 'schedule',
            icon: Clock,
            text: 'Set deadline',
            reason: 'Tasks with deadlines get done faster'
          });
        }

        if (task.title.length > 50) {
          taskSuggestions.push({
            type: 'split',
            icon: Split,
            text: 'Break down task',
            reason: 'Large tasks are easier when broken down'
          });
        }

        if (task.priority === 'low' && (task.title.toLowerCase().includes('urgent') || task.title.toLowerCase().includes('important'))) {
          taskSuggestions.push({
            type: 'priority',
            icon: Zap,
            text: 'Increase priority',
            reason: 'Task seems urgent based on content'
          });
        }

        // Add at least one suggestion for each task
        if (taskSuggestions.length === 0) {
          taskSuggestions.push({
            type: 'general',
            icon: Lightbulb,
            text: 'Get focused advice',
            reason: 'AI can provide specific guidance for this task'
          });
        }

        if (taskSuggestions.length > 0) {
          basicSuggestions.push({
            taskId: task.id,
            taskTitle: task.title,
            suggestions: taskSuggestions.slice(0, 2) // Max 2 suggestions per task
          });
        }
      }

      setAiSuggestions(basicSuggestions);
      setShowAISuggestions(basicSuggestions.length > 0);
    }
  }, [tasks, chat]);

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
      };

      recognition.start();
    }
  };

  // Calculate streaks
  const calculateStreaks = React.useCallback(() => {
    const newStreaks: { [key: string]: number } = {};
    const today = new Date().toDateString();

    tasks.forEach(task => {
      if (task.completed && new Date(task.updatedAt).toDateString() === today) {
        const category = task.category || 'general';
        newStreaks[category] = (newStreaks[category] || 0) + 1;
      }
    });

    setStreaks(newStreaks);
  }, [tasks]);

  // Check for new badges
  const checkBadges = React.useCallback(() => {
    const completedToday = tasks.filter(t =>
      t.completed &&
      new Date(t.updatedAt).toDateString() === new Date().toDateString()
    ).length;

    const totalCompleted = tasks.filter(t => t.completed).length;

    setBadges(prevBadges => {
      const newBadges = [...prevBadges];
      let hasChanges = false;

      if (completedToday >= 5 && !prevBadges.includes('productive-day')) {
        newBadges.push('productive-day');
        hasChanges = true;
      }

      if (totalCompleted >= 50 && !prevBadges.includes('task-master')) {
        newBadges.push('task-master');
        hasChanges = true;
      }

      return hasChanges ? newBadges : prevBadges;
    });
  }, [tasks]);

  // Only calculate streaks and badges when tasks change, not AI suggestions
  // AI suggestions are now opt-in to avoid automatic token consumption
  useEffect(() => {
    calculateStreaks();
    checkBadges();
  }, [tasks, calculateStreaks, checkBadges]);

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
      // Set empty tasks array on error to prevent showing undefined state
      setTasks([]);
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

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder tasks
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, removed);
    setTasks(newTasks);

    setDraggedTask(null);
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = showCompleted ? tasks : tasks.filter(t => !t.completed);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply view filter
    switch (filter) {
      case 'today':
        filtered = filtered.filter(t => t.dueDate === new Date().toISOString().split('T')[0]);
        break;
      case 'upcoming':
        filtered = filtered.filter(t => !t.completed && t.dueDate);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'due_date':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Group
    if (groupBy === 'none') return { 'All Tasks': filtered };

    const grouped: { [key: string]: Task[] } = {};

    filtered.forEach(task => {
      let key = 'Other';
      switch (groupBy) {
        case 'priority':
          key = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
          break;
        case 'due_date':
          if (!task.dueDate) {
            key = 'No Due Date';
          } else {
            const dueDate = new Date(task.dueDate);
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
          key = task.category || 'Uncategorized';
          break;
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });

    return grouped;
  };

  const generateAISuggestions = async (taskTitle: string): Promise<string[]> => {
    try {
      // First try to use the AI service analyzeTask
      const analysis = await aiService.analyzeTask(taskTitle);
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        return analysis.suggestions;
      }

      // If no suggestions from analyzeTask, use chat function for dynamic suggestions
      const aiResponse = await chat(
        `Analyze this task and provide 3 specific, actionable suggestions to help complete it effectively: "${taskTitle}"
        
        Focus on practical advice like:
        - Breaking down complex tasks
        - Time management strategies
        - Preparation steps
        - Tools or resources needed
        - Best practices for this type of task
        
        Respond with just the suggestions, one per line, without numbering or bullets.`,
        `task_suggestions_${Date.now()}`
      );

      // Parse the AI response into suggestions
      const suggestions = aiResponse
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+\.|-|•/)) // Remove numbering/bullets
        .slice(0, 3); // Take first 3 suggestions

      if (suggestions.length > 0) {
        return suggestions;
      }

      // If AI response parsing fails, fall back to the original aiService
      return analysis.suggestions || [];

    } catch (error) {
      console.error('Error getting AI suggestions:', error);

      // Provide contextual fallback suggestions based on task type
      if (taskTitle.toLowerCase().includes('project')) {
        return ['Break into smaller subtasks', 'Set milestone deadlines', 'Create project timeline'];
      }

      if (taskTitle.toLowerCase().includes('meeting')) {
        return ['Prepare agenda beforehand', 'Send calendar invite', 'Book appropriate meeting room'];
      }

      if (taskTitle.toLowerCase().includes('email')) {
        return ['Draft key points first', 'Schedule for optimal send time', 'Set follow-up reminder'];
      }

      if (taskTitle.toLowerCase().includes('call')) {
        return ['Prepare talking points', 'Schedule at convenient time', 'Have backup contact method'];
      }

      if (taskTitle.toLowerCase().includes('research')) {
        return ['Define research questions', 'Identify reliable sources', 'Set time limit for research'];
      }

      // General productivity suggestions
      return [
        'Break task into smaller, manageable steps',
        'Schedule dedicated time to work on this',
        'Identify what resources you need first',
        'Set a specific deadline for completion',
        'Consider if this can be delegated or automated'
      ].sort(() => Math.random() - 0.5).slice(0, 3); // Randomize and pick 3
    }
  };

  // Handle AI suggestion actions
  const handleAiSuggestion = async (taskId: string, suggestionType: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      switch (suggestionType) {
        case 'split':
          const splitSuggestion = await chat(
            `Break down this task into 2-3 smaller, actionable subtasks: "${task.title}". 
            Respond with just the subtasks, one per line, starting with "- ".`,
            'task_splitting'
          );

          // Add the subtasks as new tasks
          const subtasks = splitSuggestion.split('\n')
            .filter(line => line.trim().startsWith('- '))
            .map(line => line.replace('- ', '').trim());

          for (const subtask of subtasks) {
            if (subtask) {
              const taskId = await firebaseService.addTask(subtask, task.priority, task.dueDate);
              const newTaskObj: Task = {
                id: typeof taskId === 'string' ? taskId : taskId.id,
                title: subtask,
                completed: false,
                priority: task.priority,
                dueDate: task.dueDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                streak: 0
              };
              setTasks(prev => [newTaskObj, ...prev]);
            }
          }

          // Mark original task as completed
          await toggleTask(taskId);
          break;

        case 'schedule':
          try {
            // Use AI to suggest optimal timing
            const scheduleResponse = await chat(
              `Suggest an optimal deadline for this task: "${task.title}". 
              Current priority: ${task.priority}.
              Consider the task complexity and typical completion time.
              
              Respond with just a number of days from today (1-7) and a brief reason.
              Format: "X days - reason"
              Example: "2 days - Allows time for research and execution"`,
              'task_scheduling'
            );

            // Parse AI response to get days
            const daysMatch = scheduleResponse.match(/(\d+)\s*days?/i);
            const suggestedDays = daysMatch ? parseInt(daysMatch[1]) : 1;
            const daysToAdd = Math.min(Math.max(suggestedDays, 1), 7); // Clamp between 1-7 days

            const suggestedDate = new Date();
            suggestedDate.setDate(suggestedDate.getDate() + daysToAdd);
            const scheduledDate = suggestedDate.toISOString().split('T')[0];

            setTasks(prev => prev.map(t =>
              t.id === taskId ? { ...t, dueDate: scheduledDate, updatedAt: new Date().toISOString() } : t
            ));
          } catch (aiError) {
            console.error('Error getting AI schedule suggestion:', aiError);
            // Fallback to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];

            setTasks(prev => prev.map(t =>
              t.id === taskId ? { ...t, dueDate: tomorrowDate, updatedAt: new Date().toISOString() } : t
            ));
          }
          break;

        case 'priority':
          try {
            // Use AI to suggest appropriate priority
            const priorityResponse = await chat(
              `Analyze this task and suggest the appropriate priority level: "${task.title}".
              Current priority: ${task.priority}.
              Due date: ${task.dueDate || 'not set'}.
              
              Consider urgency, importance, and impact.
              Respond with just: "high", "medium", or "low" and a brief reason.
              Format: "priority - reason"
              Example: "high - Time-sensitive with significant impact"`,
              'task_priority'
            );

            // Parse AI response to get priority
            const priorityMatch = priorityResponse.toLowerCase().match(/(high|medium|low)/);
            const suggestedPriority = priorityMatch ? priorityMatch[1] as 'high' | 'medium' | 'low' :
              (task.priority === 'low' ? 'medium' : task.priority === 'medium' ? 'high' : 'high');

            setTasks(prev => prev.map(t =>
              t.id === taskId ? { ...t, priority: suggestedPriority, updatedAt: new Date().toISOString() } : t
            ));
          } catch (aiError) {
            console.error('Error getting AI priority suggestion:', aiError);
            // Fallback to simple increment
            const newPriority = task.priority === 'low' ? 'medium' :
              task.priority === 'medium' ? 'high' : 'high';
            setTasks(prev => prev.map(t =>
              t.id === taskId ? { ...t, priority: newPriority, updatedAt: new Date().toISOString() } : t
            ));
          }
          break;

        case 'general':
        default:
          // For general AI suggestions, use chat to provide contextual advice
          try {
            const adviceResponse = await chat(
              `Provide specific, actionable advice for this task: "${task.title}".
              Current status: Priority ${task.priority}, ${task.dueDate ? `due ${task.dueDate}` : 'no deadline'}.
              
              Give 1-2 concrete next steps the user should take to make progress on this task.
              Be specific and practical.`,
              'task_advice'
            );

            // Show the advice in a simple alert for now (could be enhanced with a modal)
            alert(`AI Advice for "${task.title}":\n\n${adviceResponse}`);
          } catch (aiError) {
            console.error('Error getting AI advice:', aiError);
            alert(`Consider breaking down "${task.title}" into smaller, more manageable steps.`);
          }
          break;
      }

      // Remove the suggestion after action
      setAiSuggestions(prev =>
        prev.filter(s => s.taskId !== taskId ||
          !s.suggestions.some((sug: any) => sug.type === suggestionType))
      );

    } catch (error) {
      console.error('Error handling AI suggestion:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;

    try {
      const parsedTask = parseNaturalLanguage(newTask);

      // Create initial task object
      const initialTaskData = {
        ...parsedTask,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: selectedPriority,
        category: selectedCategory || undefined
      };

      // Use scheduled time or parsed due date
      const dueDate = scheduledTime ? scheduledTime.split('T')[0] : initialTaskData.dueDate;

      const taskId = await firebaseService.addTask(
        initialTaskData.title!,
        initialTaskData.priority!,
        dueDate
      );

      // Removed automatic AI suggestions to prevent hanging and token consumption
      const aiSuggestions: string[] = [];

      const newTaskObj: Task = {
        id: typeof taskId === 'string' ? taskId : taskId.id,
        title: initialTaskData.title!,
        completed: false,
        priority: initialTaskData.priority!,
        dueDate: dueDate,
        category: initialTaskData.category,
        aiSuggestions,
        createdAt: initialTaskData.createdAt,
        updatedAt: initialTaskData.updatedAt,
        streak: 0
      };

      // Schedule notifications if due date is set (with error handling)
      try {
        if (dueDate) {
          taskNotificationService.scheduleTaskDueNotification(newTaskObj as any);

          // Also schedule a reminder notification
          const reminderTime = new Date(new Date(dueDate).getTime() - 15 * 60 * 1000); // 15 minutes before
          if (reminderTime > new Date()) {
            taskNotificationService.scheduleTaskReminder(newTaskObj as any, reminderTime);
          }
        }
      } catch (notificationError) {
        console.error('Error scheduling notifications:', notificationError);
        // Continue without notifications
      }

      setTasks(prev => [newTaskObj, ...prev]);
      setNewTask('');
      setSelectedCategory('');
      setSelectedPriority('medium');
      setScheduledTime('');
      // Removed automatic AI suggestions - now user must click "Get AI Tips" button
    } catch (error) {
      console.error('Error adding task:', error);
      // Show user-friendly error message
      alert('Failed to add task. Please check your internet connection and try again.');
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

  const groupedTasks = getFilteredAndSortedTasks();
  const completedToday = tasks.filter(t =>
    t.completed &&
    new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header with badges and streaks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Smart Todo List
              </h1>

              {/* Streak indicator */}
              {completedToday > 0 && (
                <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
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
                  className={`p-2 rounded ${viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  title="List view"
                  aria-label="Switch to list view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded ${viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  title="Calendar view"
                  aria-label="Switch to calendar view"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowNotificationSettings(true)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                title="Notification Settings"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300">
            AI-powered task management with natural language input
          </p>
        </motion.div>

        {/* AI Suggestions Panel */}
        {showAISuggestions && aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100">AI Suggestions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAISuggestions(false)}
                className="text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div key={suggestion.taskId} className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
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
          </motion.div>
        )}

        {/* Enhanced Add Task Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Try: 'Call John tomorrow at 3pm' or 'Urgent: Finish project proposal' (voice input available!)"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  list="task-suggestions"
                />
                <button
                  type="button"
                  onClick={startVoiceInput}
                  disabled={isListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${isListening
                    ? 'text-red-500 animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
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

            {/* Enhanced task options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category selection */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full p-2 text-sm border rounded-lg ${darkMode
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
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className={`w-full p-2 text-sm border rounded-lg ${darkMode
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
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Due date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full p-2 text-sm border rounded-lg ${darkMode
                    ? 'border-gray-600 bg-gray-700 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                    }`}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          {/* Main filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'today', 'upcoming', 'completed'].map((filterType) => (
                <button
                  key={filterType}
                  type="button"
                  onClick={() => setFilter(filterType as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterType
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
          </div>

          {/* Advanced controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-4">
              {/* Group by */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className={`text-sm border rounded px-2 py-1 ${darkMode
                    ? 'border-gray-600 bg-gray-700 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  title="Group tasks by"
                  aria-label="Group tasks by"
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
                  title="Sort tasks by"
                  aria-label="Sort tasks by"
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`text-sm border rounded px-2 py-1 ${darkMode
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
                  if (showAISuggestions) {
                    setShowAISuggestions(false);
                  } else {
                    await generateAiSuggestions();
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${showAISuggestions
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                disabled={aiLoading}
              >
                <Lightbulb className="w-3 h-3" />
                <span>{aiLoading ? 'Generating...' : showAISuggestions ? 'Hide Tips' : 'Get AI Tips'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName}>
              {groupBy !== 'none' && (
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  {groupName}
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {groupTasks.length}
                  </span>
                </h3>
              )}

              <div className="space-y-4">
                <AnimatePresence>
                  {groupTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}

                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${draggedTask === task.id ? 'opacity-50' : ''
                        } ${task.completed
                          ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10 opacity-75'
                          : isOverdue(task.dueDate)
                            ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <div
                        className="flex items-start gap-4"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, task.id)}
                      >
                        {/* Drag handle */}
                        <div className="mt-2 cursor-move text-gray-400 hover:text-gray-600">
                          <Grip className="w-4 h-4" />
                        </div>

                        <motion.button
                          onClick={() => toggleTask(task.id)}
                          className={`mt-1 transition-colors ${task.completed
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
                            <h3 className={`text-lg font-medium ${task.completed
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

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 ${isOverdue(task.dueDate)
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : ''
                                }`}>
                                <Clock className="w-3 h-3" />
                                <span>
                                  {isOverdue(task.dueDate) && !task.completed ? 'Overdue: ' : 'Due: '}
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {task.category && (
                              <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span>{task.category}</span>
                              </div>
                            )}
                          </div>

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
                          {!task.completed && (
                            <motion.button
                              onClick={() => {
                                const newPriority = task.priority === 'low' ? 'medium' :
                                  task.priority === 'medium' ? 'high' : 'low';
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id ? { ...t, priority: newPriority, updatedAt: new Date().toISOString() } : t
                                ));
                              }}
                              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Change priority"
                            >
                              <Star className="w-4 h-4" />
                            </motion.button>
                          )}

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
              </div>
            </div>
          ))}

          {Object.values(groupedTasks).flat().length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No tasks found' : 'Ready to be productive?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first task using natural language like "Call John tomorrow"'
                }
              </p>
              {!searchTerm && (
                <div className="mt-4 text-xs text-gray-400">
                  💡 Tip: Try using voice input or set priorities for better organization
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Upcoming Tasks
            </h3>

            <div className="space-y-3">
              {tasks
                .filter(t => t.dueDate && !t.completed)
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                .slice(0, 5)
                .map(task => {
                  const dueDate = new Date(task.dueDate!);
                  const today = new Date();
                  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                        <div className={`text-sm ${diffDays < 0 ? 'text-red-500' :
                          diffDays === 0 ? 'text-orange-500' :
                            diffDays <= 3 ? 'text-yellow-500' : 'text-gray-500'
                          }`}>
                          {diffDays < 0 ? `${Math.abs(diffDays)} days overdue` :
                            diffDays === 0 ? 'Due today' :
                              diffDays === 1 ? 'Due tomorrow' :
                                `Due in ${diffDays} days`}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                    </div>
                  );
                })}

              {tasks.filter(t => t.dueDate && !t.completed).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Motivational section for empty state */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl text-center"
          >
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              "The secret of getting ahead is getting started." - Mark Twain
            </p>
          </motion.div>
        )}

        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
        )}
      </div>
    </div>
  );
};

export default EnhancedTodoList;