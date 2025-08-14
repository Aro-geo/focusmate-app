import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  Smile, 
  Meh, 
  Frown,
  Brain,
  Plus,
  ChevronDown,
  Timer,
  Target,
  Zap,
  Clock,
  Loader2,
  Settings,
  History,
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FloatingAssistant from '../components/FloatingAssistant';
import FormattedMessage from '../components/FormattedMessage';
import MobilePomodoro from '../components/MobilePomodoro';
import aiService from '../services/AIService';
import useResponsive from '../hooks/useResponsive';
import DatabasePomodoroService from '../services/DatabasePomodoroService';
import { useAuth } from '../context/AuthContext';

// Types
type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';
type MoodType = 'great' | 'okay' | 'tired' | null;

interface Task {
  id: number;
  text: string;
}

interface Distraction {
  type: string;
  notes: string;
  timestamp: number;
}

interface Session {
  task: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  mode: PomodoroMode;
  mood: MoodType;
  feedback: string | null;
  completed: boolean;
  notes: string | null;
  distractions: Distraction[] | null;
  timestamp: number;
  id?: string;
}

const Pomodoro: React.FC = () => {
  const { darkMode } = useTheme();
  const { isMobile } = useResponsive();
  
  // Use mobile-optimized component for mobile devices
  if (isMobile) {
    return <MobilePomodoro />;
  }

  // Use desktop component
  return <PomodoroDesktop darkMode={darkMode} />;
};

// Desktop Pomodoro component
const PomodoroDesktop: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  // Pomodoro Settings
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    soundEnabled: true,
    dailyGoal: 8
  });
  
  // Timer State
  const [timeRemaining, setTimeRemaining] = useState<number>(settings.workDuration * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0); // Total focus time in minutes
  
  // Task Management
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Project proposal" },
    { id: 2, text: "Client meeting" },
    { id: 3, text: "Documentation" },
    { id: 4, text: "Code review" }
  ]);
  const [customTask, setCustomTask] = useState<string>("");
  
  // Session Data
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  
  // UI Controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showSessionHistory, setShowSessionHistory] = useState<boolean>(false);
  const [showDistractionModal, setShowDistractionModal] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [selectedSessionNotes, setSelectedSessionNotes] = useState<{notes: string | null, task: string | null} | null>(null);
  
  // Distractions & Notes
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [currentDistraction, setCurrentDistraction] = useState<{type: string; notes: string}>({ type: '', notes: '' });
  const [sessionNotes, setSessionNotes] = useState<string>("");
  
  // Performance Stats
  const [sessionStats, setSessionStats] = useState<{
    today: number;
    week: number;
    month: number;
    total: number;
  }>({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  
  // AI Assistant state
  const [aiMessage, setAiMessage] = useState<string>("Ready to focus? Select a task and let's get started with a productive Pomodoro session!");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiChatInput, setAiChatInput] = useState<string>('');
  
  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effects
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isActive]);

  // Load saved settings and session history
  useEffect(() => {
    // Load settings from local storage
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }

    // Load session history from service
    const loadSessionHistory = async () => {
      try {
        const sessions = await DatabasePomodoroService.getSessions();
        if (sessions && sessions.length > 0) {
          // Convert to our Session format
          const formattedSessions = sessions.map(session => ({
            id: session.id,
            task: session.taskName,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.durationMinutes,
            mode: 'work' as PomodoroMode,
            mood: null as MoodType,
            feedback: null,
            completed: session.completed,
            notes: session.notes || null,
            distractions: null,
            timestamp: session.startTime.getTime()
          }));
          
          // Calculate total focus time for today
          const todaysSessions = sessions.filter(s => 
            s.startTime.toDateString() === new Date().toDateString() && s.completed
          );
          
          setSessionHistory(formattedSessions);
          setCompletedSessions(todaysSessions.length);
          
          // Calculate total focus time in minutes
          const focusTimeMinutes = todaysSessions.reduce((total, session) => {
            return total + (session.durationMinutes || 0);
          }, 0);
          setTotalFocusTime(focusTimeMinutes);
        }
      } catch (error) {
        console.error('Error loading session history:', error);
      }
    };
    
    loadSessionHistory();
  }, []);

  // Mode change effect
  useEffect(() => {
    if (mode === 'work') {
      setTimeRemaining(settings.workDuration * 60);
    } else if (mode === 'shortBreak') {
      setTimeRemaining(settings.shortBreakDuration * 60);
    } else {
      setTimeRemaining(settings.longBreakDuration * 60);
    }
    setIsActive(false);
  }, [mode, settings]);

  // Functions
  const toggleTimer = () => {
    if (!isActive && timeRemaining === settings.workDuration * 60 && mode === 'work') {
      // Starting a new session
      const newSession: Session = {
        task: selectedTask,
        startTime: new Date(),
        endTime: null,
        duration: settings.workDuration,
        mode: mode,
        mood: null,
        feedback: null,
        completed: false,
        notes: sessionNotes,
        distractions: [],
        timestamp: Date.now(),
        id: `session-${Date.now()}`
      };
      setCurrentSession(newSession);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') {
      setTimeRemaining(settings.workDuration * 60);
    } else if (mode === 'shortBreak') {
      setTimeRemaining(settings.shortBreakDuration * 60);
    } else {
      setTimeRemaining(settings.longBreakDuration * 60);
    }
  };

  const skipToBreak = () => {
    if (mode === 'work') {
      completeSession();
    }
  };

  const completeSession = useCallback(() => {
    setIsActive(false);

    // Play sound if enabled
    if (settings.soundEnabled) {
      // Create and play a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }

    if (mode === 'work') {
      // Complete work session
      const sessionsCount = completedSessions + 1;
      setCompletedSessions(sessionsCount);
      
      // Add the duration of this session to total focus time
      const sessionDurationMinutes = settings.workDuration;
      setTotalFocusTime(prevTime => prevTime + sessionDurationMinutes);

      // Update stats
      setSessionStats(prev => ({
        ...prev,
        today: prev.today + 1,
        week: prev.week + 1,
        month: prev.month + 1,
        total: prev.total + 1
      }));

      // Update streak
      const lastSessionDate = sessionHistory.length > 0 
        ? new Date(sessionHistory[0].timestamp).toDateString() 
        : null;
      const today = new Date().toDateString();
      
      if (lastSessionDate === today) {
        // Sessions on the same day, increment streak
        setCurrentStreak(prev => prev + 1);
      } else if (lastSessionDate) {
        // Check if last session was yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (lastSessionDate === yesterdayString) {
          // Session yesterday, maintain streak
          setCurrentStreak(prev => prev + 1);
        } else {
          // Break in streak, reset
          setCurrentStreak(1);
        }
      } else {
        // First session ever
        setCurrentStreak(1);
      }
      
      // Update longest streak if current streak is longer
      if (currentStreak > longestStreak) {
        setLongestStreak(currentStreak);
      }

      // Check daily goal achievement
      if (sessionsCount === settings.dailyGoal) {
        // User reached their daily goal
        setTimeout(() => {
          setAiMessage(`Congratulations! You've reached your daily goal of ${settings.dailyGoal} Pomodoros! 🎉`);
          // Could trigger confetti animation here
        }, 1000);
      }

      // Update current session
      if (currentSession) {
        const updatedSession: Session = {
          ...currentSession,
          endTime: new Date(),
          duration: settings.workDuration,
          completed: true,
          notes: sessionNotes || null,
          distractions: distractions.length > 0 ? distractions : null,
          timestamp: Date.now()
        };
        setCurrentSession(updatedSession);

        // Add to sessions history at the beginning of array (most recent first)
        setSessionHistory(prev => [updatedSession, ...prev]);
        
        // Save to Firestore
        saveSessionToFirestore(updatedSession);
      }

      // Clear session notes and distractions
      setSessionNotes("");
      setDistractions([]);

      // Determine next break type
      if (sessionsCount % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
        // Auto-start break if enabled
        if (settings.autoStartBreaks) {
          setTimeout(() => setIsActive(true), 500);
        }
      } else {
        setMode('shortBreak');
        setTimeRemaining(settings.shortBreakDuration * 60);
        // Auto-start break if enabled
        if (settings.autoStartBreaks) {
          setTimeout(() => setIsActive(true), 500);
        }
      }
    } else {
      // Complete break
      setMode('work');
      setTimeRemaining(settings.workDuration * 60);
      // Auto-start next pomodoro if enabled
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsActive(true), 500);
      }
    }
  }, [completedSessions, currentSession, mode, soundEnabled, timeRemaining, settings]);

  // Helper functions for new features
  const updateSettings = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Save settings to local storage
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    // Update timer durations
    if (mode === 'work') {
      setTimeRemaining(settings.workDuration * 60);
    } else if (mode === 'shortBreak') {
      setTimeRemaining(settings.shortBreakDuration * 60);
    } else {
      setTimeRemaining(settings.longBreakDuration * 60);
    }
    setShowSettings(false);
  };

  const logDistraction = () => {
    if (!currentDistraction.type) return;
    
    const newDistraction: Distraction = {
      ...currentDistraction,
      timestamp: Date.now()
    };
    
    // Add to current session's distractions
    setDistractions(prev => [...prev, newDistraction]);
    
    // Clear form
    setCurrentDistraction({ type: '', notes: '' });
    setShowDistractionModal(false);
    
    // Give feedback
    setAiMessage("Distraction logged. Good job recognizing it! Let's get back to focus.");
  };

  const saveSessionNotes = () => {
    // Update current session with notes if there is an active session
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        notes: sessionNotes
      };
      
      setCurrentSession(updatedSession);
      
      // Update the session in the history if it exists there
      if (currentSession.id) {
        setSessionHistory(prev => 
          prev.map(session => 
            session.id === currentSession.id 
              ? { ...session, notes: sessionNotes } 
              : session
          )
        );
        
        // Also save to database if we have a session service
        try {
          if (DatabasePomodoroService.updateSession) {
            DatabasePomodoroService.updateSession(currentSession.id, { notes: sessionNotes });
          }
        } catch (error) {
          console.error('Error saving session notes:', error);
        }
      }
    }
    
    setShowNotesModal(false);
    setAiMessage("Notes saved. Good job documenting your progress!");
  };

  // Save session to database
  const saveSessionToFirestore = async (session: Session) => {
    try {
      await DatabasePomodoroService.saveSession({
        taskName: session.task,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.duration,
        sessionType: 'pomodoro',
        completed: true,
        notes: session.notes || ''
      });
      console.log('Pomodoro session saved to Firestore');
    } catch (error) {
      console.error('Error saving Pomodoro session to Firestore:', error);
    }
  };

  const generateAIFeedback = async (session: Session) => {
    try {
      setIsAiLoading(true);
      const prompt = `A user just completed a ${session.duration} minute focus session working on "${session.task}". 
      Provide a brief, encouraging feedback message about their productivity. Format it with a short bold header followed by a motivational message. 
      Keep it under 50 words total. Use markdown formatting with ## for headers.`;
      
      const response = await aiService.chat(prompt);
      setAiMessage(response.response);
    } catch (error) {
      console.error('Failed to generate AI feedback:', error);
      setAiMessage("## Well Done! 🎉\nGreat job completing this focus session! You're building excellent productivity habits.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendAIMessage = async () => {
    if (!aiChatInput.trim()) return;
    
    try {
      setIsAiLoading(true);
      const context = `User is in ${mode} mode with ${timeRemaining} seconds remaining. They have completed ${completedSessions} sessions today. Current task: ${selectedTask || 'none selected'}. Timer is ${isActive ? 'running' : 'paused'}.`;
      const prompt = `${context} User asks: ${aiChatInput}. 
      
      Provide helpful, contextual advice formatted with clear structure:
      1. Use markdown ## for a brief engaging header related to their question
      2. Break your response into 2-3 short paragraphs with line breaks between them
      3. If appropriate, include a bullet point list of 2-3 actionable tips
      4. Be encouraging and personalized, but concise (max 120 words total)`;
      
      const response = await aiService.chat(prompt);
      setAiMessage(response.response);
      setAiChatInput('');
    } catch (error) {
      console.error('Failed to send AI message:', error);
      setAiMessage("## Focus Assistant\n\nI'm having trouble connecting right now, but I'm here to help you stay focused!\n\nTry again in a moment or use the 'Get Tip' button for quick advice.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAskAI = () => {
    sendAIMessage();
  };

  const handleGetTip = async () => {
    try {
      setIsAiLoading(true);
      const context = `User has completed ${completedSessions} Pomodoro sessions today. Current mode: ${mode}. Time remaining: ${Math.floor(timeRemaining/60)} minutes. Task: ${selectedTask || 'none selected'}.`;
      const prompt = `${context} Give a personalized productivity tip based on their current situation.
      
      Format your response with:
      1. A brief, engaging header with markdown ## syntax
      2. A short paragraph explaining the tip (2-3 sentences)
      3. If appropriate, include 2-3 bullet points with actionable advice
      4. End with a short encouraging sentence
      5. Total response should be under 100 words`;
      
      const response = await aiService.chat(prompt);
      setAiMessage(response.response);
    } catch (error) {
      console.error('Failed to get tip:', error);
      const tips = [
        "## Focus Fundamentals 💡\n\nFocus on one task at a time - multitasking reduces productivity by up to 40%!\n\n* Break large tasks into smaller chunks\n* Set clear goals before each session\n* Celebrate small wins\n\nYou're making great progress!",
        "## Pomodoro Power 🎯\n\nBreaking large tasks into 25-minute chunks improves focus and makes progress tracking easier.\n\n* Start with the most challenging task\n* Document your accomplishments\n* Gradually increase focus duration\n\nConsistency is key to success!",
        "## Strategic Breaks ⏰\n\nTake your breaks seriously - they help prevent mental fatigue and maintain peak performance.\n\n* Stand up and stretch\n* Look away from screens\n* Take deep breaths\n\nRest is a crucial part of productivity!",
        "## 2-Minute Rule 🧠\n\nIf you're struggling to focus, try the 2-minute rule: do quick tasks immediately.\n\n* Eliminate small distractions first\n* Build momentum with easy wins\n* Save complex tasks for deep work sessions\n\nSmall steps lead to big results!"
      ];
      setAiMessage(tips[Math.floor(Math.random() * tips.length)]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTaskSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "custom") {
      setSelectedTask(null);
    } else {
      setSelectedTask(value);
      setCustomTask("");
    }
  };

  const addCustomTask = () => {
    if (customTask.trim()) {
      const newTask = { id: Date.now(), text: customTask.trim() };
      setTasks([...tasks, newTask]);
      setSelectedTask(customTask.trim());
      setCustomTask("");
    }
  };

  // Quick start functions for different durations
  const quickStart = (minutes: number) => {
    setIsActive(false);
    const seconds = minutes * 60;
    setTimeRemaining(seconds);
    setMode('work');
    setTimeout(() => {
      setIsActive(true);
    }, 100);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getModeText = (): string => {
    switch (mode) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Focus Time';
    }
  };

  const getModeColor = (): string => {
    switch (mode) {
      case 'work': return 'text-red-600 dark:text-red-400';
      case 'shortBreak': return 'text-green-600 dark:text-green-400';
      case 'longBreak': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-red-600 dark:text-red-400';
    }
  };

  const calculateProgress = (): number => {
    let totalTime: number;
    if (mode === 'work') {
      totalTime = settings.workDuration * 60;
    } else if (mode === 'shortBreak') {
      totalTime = settings.shortBreakDuration * 60;
    } else {
      totalTime = settings.longBreakDuration * 60;
    }

    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header - positioned on the left side */}
        <div className="flex items-center mb-8">
          <div className="flex-1">
            <h1 className={`text-3xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Pomodoro Timer
            </h1>
            <p className={`text-lg ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Focus • Work • Achieve
            </p>
          </div>
        </div>

        {/* Main Layout - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column - Timer and Controls (70% on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Quick Focus Buttons */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Zap className="mr-2" size={20} />
                Quick Focus
              </h2>
              <div className="flex flex-wrap gap-3">
                {[15, 25, 50].map((minutes) => (
                  <motion.button
                    key={minutes}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => quickStart(minutes)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } shadow-lg hover:shadow-xl`}
                  >
                    <Clock className="inline mr-2" size={16} />
                    {minutes}m
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Timer Display */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl p-8 text-center ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <div className={`text-sm font-medium mb-4 ${getModeColor()}`}>
                {getModeText()}
              </div>
              
              {/* Circular Progress */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={darkMode ? "#374151" : "#E5E7EB"}
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={mode === 'work' ? "#EF4444" : mode === 'shortBreak' ? "#10B981" : "#3B82F6"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - calculateProgress() / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-5xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTimer}
                  className={`p-4 rounded-full ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } shadow-lg transition-colors`}
                >
                  {isActive ? <Pause size={24} /> : <Play size={24} />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetTimer}
                  className={`p-4 rounded-full ${
                    darkMode
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  } shadow-lg transition-colors`}
                >
                  <RotateCcw size={24} />
                </motion.button>

                {mode === 'work' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={skipToBreak}
                    className={`p-4 rounded-full ${
                      darkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } shadow-lg transition-colors`}
                  >
                    <SkipForward size={24} />
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-4 rounded-full ${
                    soundEnabled 
                      ? (darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600')
                      : (darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600')
                  } text-white shadow-lg transition-colors`}
                >
                  {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(true)}
                  className={`p-4 rounded-full ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  } shadow-lg transition-colors`}
                >
                  <Settings size={24} />
                </motion.button>
              </div>

              {/* Task Selection */}
              <div className="max-w-md mx-auto">
                <label htmlFor="task-select" className="sr-only">
                  Select a task for this Pomodoro session
                </label>
                <div className="relative">
                  <select
                    id="task-select"
                    value={selectedTask || ""}
                    onChange={handleTaskSelect}
                    title="Select a task for this Pomodoro session"
                    aria-label="Select a task for this Pomodoro session"
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select a task...</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.text}>
                        {task.text}
                      </option>
                    ))}
                    <option value="custom">+ Add custom task</option>
                  </select>
                </div>

                {/* Custom Task Input */}
                <AnimatePresence>
                  {selectedTask === null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex space-x-2"
                    >
                      <input
                        type="text"
                        value={customTask}
                        onChange={(e) => setCustomTask(e.target.value)}
                        placeholder="Enter custom task..."
                        className={`flex-1 p-3 rounded-xl border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomTask()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCustomTask}
                        className={`px-4 py-3 rounded-xl ${
                          darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } shadow-lg transition-colors`}
                      >
                        <Plus size={20} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Session Tools Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <FileText className="mr-2" size={20} />
                Session Tools
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSessionHistory(true)}
                  className={`flex items-center justify-center px-4 py-3 rounded-xl ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } shadow-lg transition-colors`}
                >
                  <History size={18} className="mr-2" />
                  Session History
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotesModal(true)}
                  className={`flex items-center justify-center px-4 py-3 rounded-xl ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } shadow-lg transition-colors`}
                  disabled={!isActive && mode !== 'work'}
                >
                  <FileText size={18} className="mr-2" />
                  Add Notes
                </motion.button>
              </div>
            </motion.div>

            {/* Session Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Target className="mr-2" size={20} />
                Today's Progress
              </h3>
              
              {/* Progress bar towards daily goal */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {completedSessions} of {settings.dailyGoal} pomodoros
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.min(Math.round((completedSessions / settings.dailyGoal) * 100), 100)}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-2 rounded-full bg-blue-500 transition-all duration-300 progress-bar-width-${Math.min(Math.round((completedSessions / settings.dailyGoal) * 100), 100)}`}
                  >
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {completedSessions}
                  </div>
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Sessions Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
                  </div>
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Focus Time
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotesModal(true)}
                  className={`text-sm flex items-center ${
                    darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  }`}
                >
                  <FileText size={14} className="mr-1" />
                  Add Notes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSessionHistory(true)}
                  className={`text-sm flex items-center ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <History size={14} className="mr-1" />
                  View History
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - AI Assistant (30% on desktop) */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 h-full ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white/70 border border-white/20 shadow-lg backdrop-blur-sm'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Brain className="mr-2" size={20} />
                AI Focus Coach
              </h3>
              
              <div className={`p-4 rounded-xl mb-4 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <FormattedMessage 
                  message={aiMessage}
                  className={`text-md leading-relaxed ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                />
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  placeholder="Ask for focus tips..."
                  className={`flex-1 p-3 rounded-xl border text-sm ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendAIMessage}
                  disabled={isAiLoading}
                  className={`px-4 py-3 rounded-xl ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } shadow-lg transition-colors disabled:opacity-50`}
                >
                  <span className="flex items-center justify-center">
                    {isAiLoading ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Zap size={16} className="mr-2" />
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-lg w-full rounded-2xl p-6 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } shadow-2xl`}
            >
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close settings modal"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Settings className="mr-2" size={24} />
                Pomodoro Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Timer Durations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="workDuration" className={`block text-sm font-medium mb-1 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Work (minutes)
                      </label>
                      <input
                        id="workDuration"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.workDuration}
                        onChange={(e) => updateSettings('workDuration', parseInt(e.target.value))}
                        className={`w-full p-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="shortBreakDuration" className={`block text-sm font-medium mb-1 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Short Break (minutes)
                      </label>
                      <input
                        id="shortBreakDuration"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.shortBreakDuration}
                        onChange={(e) => updateSettings('shortBreakDuration', parseInt(e.target.value))}
                        className={`w-full p-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="longBreakDuration" className={`block text-sm font-medium mb-1 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Long Break (minutes)
                      </label>
                      <input
                        id="longBreakDuration"
                        type="number"
                        min="5"
                        max="60"
                        value={settings.longBreakDuration}
                        onChange={(e) => updateSettings('longBreakDuration', parseInt(e.target.value))}
                        className={`w-full p-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Session Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="autoStartBreaks"
                        type="checkbox"
                        checked={settings.autoStartBreaks}
                        onChange={(e) => updateSettings('autoStartBreaks', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="autoStartBreaks" className="ml-2 block text-sm">
                        Auto-start breaks
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="autoStartPomodoros"
                        type="checkbox"
                        checked={settings.autoStartPomodoros}
                        onChange={(e) => updateSettings('autoStartPomodoros', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm">
                        Auto-start work sessions
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="longBreakInterval"
                        type="number"
                        min="2"
                        max="10"
                        value={settings.longBreakInterval}
                        onChange={(e) => updateSettings('longBreakInterval', parseInt(e.target.value))}
                        className={`w-16 p-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <label htmlFor="longBreakInterval" className="ml-2 block text-sm">
                        sessions before long break
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Daily Goals</h3>
                  <div className="flex items-center">
                    <input
                      id="dailyGoal"
                      type="number"
                      min="1"
                      max="16"
                      value={settings.dailyGoal}
                      onChange={(e) => updateSettings('dailyGoal', parseInt(e.target.value))}
                      className={`w-16 p-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <label htmlFor="dailyGoal" className="ml-2 block text-sm">
                      completed pomodoros per day
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveSettings}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distraction Logging Modal */}
      <AnimatePresence>
        {showDistractionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-md w-full rounded-2xl p-6 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } shadow-2xl`}
            >
              <button
                onClick={() => setShowDistractionModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close distraction modal"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <AlertTriangle className="mr-2" size={24} />
                Log Distraction
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="distractionType" className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type of Distraction
                  </label>
                  <select
                    id="distractionType"
                    value={currentDistraction.type}
                    onChange={(e) => setCurrentDistraction({...currentDistraction, type: e.target.value})}
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select type...</option>
                    <option value="notification">Notification</option>
                    <option value="social-media">Social Media</option>
                    <option value="colleague">Colleague Interruption</option>
                    <option value="phone">Phone Call</option>
                    <option value="personal">Personal Thought</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="distractionNotes" className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes (Optional)
                  </label>
                  <textarea
                    id="distractionNotes"
                    rows={3}
                    value={currentDistraction.notes}
                    onChange={(e) => setCurrentDistraction({...currentDistraction, notes: e.target.value})}
                    placeholder="What happened? How did you handle it?"
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logDistraction}
                    disabled={!currentDistraction.type}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                        : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400'
                    } disabled:cursor-not-allowed`}
                  >
                    Log Distraction
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session History Modal */}
      <AnimatePresence>
        {showSessionHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-4xl w-full rounded-2xl p-6 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } shadow-2xl max-h-[80vh] overflow-y-auto`}
            >
              <button
                onClick={() => setShowSessionHistory(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close session history modal"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Clock className="mr-2" size={24} />
                Session History
              </h2>

              {sessionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No session history yet. Complete your first pomodoro!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <h3 className="text-lg font-medium mb-3">Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {sessionHistory.length}
                        </div>
                        <div className="text-sm text-gray-500">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {Math.floor(
                            sessionHistory.reduce((total, session) => total + (session.duration || 0), 0) / 60
                          )}h {
                            sessionHistory.reduce((total, session) => total + (session.duration || 0), 0) % 60
                          }m
                        </div>
                        <div className="text-sm text-gray-500">Total Focus Time</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          {currentStreak}
                        </div>
                        <div className="text-sm text-gray-500">Current Streak</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {longestStreak}
                        </div>
                        <div className="text-sm text-gray-500">Longest Streak</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Progress Chart */}
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <h3 className="text-lg font-medium mb-3">Daily Progress</h3>
                    <div className="h-32 flex items-end justify-between gap-1">
                      {Array.from({ length: 7 }).map((_, i) => {
                        // Get date for each of the last 7 days
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateString = date.toDateString();
                        
                        // Filter sessions for this day
                        const dayCount = sessionHistory.filter(
                          s => new Date(s.timestamp).toDateString() === dateString
                        ).length;
                        
                        // Max height percentage based on daily goal or max sessions in a day
                        const maxHeightPercentage = Math.min(100, (dayCount / settings.dailyGoal) * 100);
                        
                        return (
                          <div key={i} className="flex flex-col items-center w-full">
                            <div className="w-full flex justify-center mb-1">
                              <div 
                                className={`w-full rounded-t-md ${
                                  maxHeightPercentage > 0 
                                    ? dayCount >= settings.dailyGoal 
                                      ? darkMode ? 'bg-green-500' : 'bg-green-600' 
                                      : darkMode ? 'bg-blue-500' : 'bg-blue-600'
                                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                } chart-bar-height-${maxHeightPercentage === 0 ? 5 : Math.round(maxHeightPercentage)}`}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session List */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Recent Sessions</h3>
                    <div className={`rounded-xl overflow-hidden border ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Task
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Duration
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Distractions
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                        }`}>
                          {sessionHistory.slice(0, 10).map((session, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(session.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {session.task || 'No task'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {session.duration} min
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {session.distractions?.length || 0}
                              </td>
                              <td className="px-6 py-4 text-sm max-w-[200px] truncate">
                                {session.notes 
                                  ? (
                                    <button 
                                      onClick={() => setSelectedSessionNotes({
                                        notes: session.notes,
                                        task: session.task
                                      })}
                                      className={`flex items-center text-sm ${
                                        darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                      }`}
                                    >
                                      <FileText size={14} className="mr-1" />
                                      View Notes
                                    </button>
                                  ) 
                                  : '-'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Session Notes Modal */}
      <AnimatePresence>
        {selectedSessionNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-lg w-full rounded-2xl p-6 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } shadow-2xl max-h-[80vh] overflow-y-auto`}
            >
              <button
                onClick={() => setSelectedSessionNotes(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close notes view"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <FileText className="mr-2" size={24} />
                Session Notes
              </h2>
              
              <div className="mb-4 text-sm text-gray-500">
                Task: {selectedSessionNotes.task || 'No task'}
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {selectedSessionNotes.notes 
                  ? <div className="whitespace-pre-wrap">{selectedSessionNotes.notes}</div>
                  : <div className="text-gray-500">No notes were recorded for this session.</div>
                }
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Floating Button */}
      <div className="fixed bottom-8 right-8 flex flex-col-reverse space-y-reverse space-y-2">
        {isActive && mode === 'work' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowDistractionModal(true)}
            className="p-4 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
            title="Log a distraction"
          >
            <AlertTriangle size={24} />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSessionHistory(true)}
          className="p-4 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
          title="View session history"
        >
          <History size={24} />
        </motion.button>

        {isActive && mode === 'work' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotesModal(true)}
            className="p-4 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors"
            title="Add session notes"
          >
            <FileText size={24} />
          </motion.button>
        )}
      </div>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-md w-full rounded-2xl p-6 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              } shadow-2xl`}
            >
              <button
                onClick={() => setShowNotesModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close notes modal"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <FileText className="mr-2" size={24} />
                Session Notes
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sessionNotes" className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Add notes for this session
                  </label>
                  <textarea
                    id="sessionNotes"
                    rows={5}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="What did you accomplish? What's next?"
                    className={`w-full p-3 rounded-xl border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotesModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveSessionNotes}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Save Notes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant */}
      <FloatingAssistant
        isAiLoading={isAiLoading}
        aiMessage={aiMessage}
        aiChatInput={aiChatInput}
        setAiChatInput={setAiChatInput}
        onAskAI={handleAskAI}
        onGetTip={handleGetTip}
      />
    </div>
  );
};

export default Pomodoro;