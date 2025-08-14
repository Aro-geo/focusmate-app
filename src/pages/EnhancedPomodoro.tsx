import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FloatingAssistant from '../components/FloatingAssistant';
import FormattedMessage from '../components/FormattedMessage';
import MobilePomodoro from '../components/MobilePomodoro';
import aiService from '../services/AIService';
import useResponsive from '../hooks/useResponsive';
import DatabasePomodoroService from '../services/DatabasePomodoroService';
import { useAuth } from '../context/AuthContext';
import AICoach from '../components/AICoach';
import EnhancedAICoach from '../components/EnhancedAICoach';
import { aiFocusCoachService } from '../services/AIFocusCoachService';
import { enhancedAIFocusCoachService } from '../services/EnhancedAIFocusCoachService';
import '../styles/EnhancedPomodoro.css';

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

const EnhancedPomodoro: React.FC = () => {
  const { darkMode } = useTheme();
  const { isMobile } = useResponsive();

  // Use mobile-optimized component for mobile devices
  if (isMobile) {
    return <MobilePomodoro />;
  }

  // Use desktop component
  return <EnhancedPomodoroDesktop darkMode={darkMode} />;
};

// Desktop Pomodoro component
const EnhancedPomodoroDesktop: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0); // Total focus time in minutes
  const [cycles, setCycles] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

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
  const [showSessionHistory, setShowSessionHistory] = useState<boolean>(false);
  const [showDistractionModal, setShowDistractionModal] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [selectedSessionNotes, setSelectedSessionNotes] = useState<{ notes: string | null, task: string | null } | null>(null);

  // Distractions & Notes
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [currentDistraction, setCurrentDistraction] = useState<{ type: string; notes: string }>({ type: '', notes: '' });
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
  const { user } = useAuth();

  // Effects
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused) {
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
  }, [isActive, isPaused]);

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
            mood: null,
            feedback: null,
            completed: true,
            notes: session.notes || null,
            distractions: [],
            timestamp: session.startTime.getTime()
          }));

          setSessionHistory(formattedSessions);

          // Calculate stats
          calculateStats(formattedSessions);
        }
      } catch (error) {
        console.error('Error loading session history:', error);
      }
    };

    loadSessionHistory();
  }, []);

  // Load user's tasks from service
  useEffect(() => {
    if (user) {
      const loadTasks = async () => {
        try {
          // Implementation would get tasks from a service
          // For now, we'll use the default tasks
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
      };

      loadTasks();

      // Initialize AI Focus Coach
      aiFocusCoachService.loadUserData(user.id);
    }
  }, [user]);

  const calculateStats = (sessions: Session[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todaySessions = sessions.filter(s => new Date(s.startTime) >= today);
    const weekSessions = sessions.filter(s => new Date(s.startTime) >= weekAgo);
    const monthSessions = sessions.filter(s => new Date(s.startTime) >= monthAgo);

    setSessionStats({
      today: todaySessions.length,
      week: weekSessions.length,
      month: monthSessions.length,
      total: sessions.length
    });
  };

  const startTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
      setSessionStartTime(new Date());

      // Create current session
      if (!currentSession) {
        setCurrentSession({
          task: selectedTask,
          startTime: new Date(),
          endTime: null,
          duration: mode === 'work' ? settings.workDuration :
            mode === 'shortBreak' ? settings.shortBreakDuration :
              settings.longBreakDuration,
          mode,
          mood: null,
          feedback: null,
          completed: false,
          notes: null,
          distractions: [],
          timestamp: Date.now()
        });
      }

      // Get AI feedback
      if (mode === 'work') {
        generateAIMessage('session-start');
      }
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  const pauseTimer = () => {
    if (isActive && !isPaused) {
      setIsPaused(true);
      generateAIMessage('pause');
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsActive(false);
    setIsPaused(false);

    // Reset time based on current mode
    const duration = mode === 'work' ? settings.workDuration :
      mode === 'shortBreak' ? settings.shortBreakDuration :
        settings.longBreakDuration;
    setTimeRemaining(duration * 60);

    // Reset current session
    setCurrentSession(null);
    setSessionStartTime(null);
    setDistractions([]);

    generateAIMessage('reset');
  };

  const skipToNextMode = () => {
    let nextMode: PomodoroMode;
    let nextDuration: number;

    if (mode === 'work') {
      // If we've completed a full set of cycles, take a long break
      if ((cycles + 1) % settings.longBreakInterval === 0) {
        nextMode = 'longBreak';
        nextDuration = settings.longBreakDuration;
      } else {
        nextMode = 'shortBreak';
        nextDuration = settings.shortBreakDuration;
      }

      // Increment completed sessions and cycles
      if (isActive) {
        setCompletedSessions(prev => prev + 1);
        setCycles(prev => prev + 1);
      }
    } else {
      nextMode = 'work';
      nextDuration = settings.workDuration;
    }

    setMode(nextMode);
    setTimeRemaining(nextDuration * 60);

    if (isActive) {
      completeSession();
    }

    // Auto-start next session if setting is enabled
    if ((nextMode === 'work' && settings.autoStartPomodoros) ||
      (nextMode !== 'work' && settings.autoStartBreaks)) {
      setTimeout(() => {
        setIsActive(true);
        setIsPaused(false);
        setSessionStartTime(new Date());

        // Create new session for work mode
        if (nextMode === 'work') {
          setCurrentSession({
            task: selectedTask,
            startTime: new Date(),
            endTime: null,
            duration: settings.workDuration,
            mode: 'work',
            mood: null,
            feedback: null,
            completed: false,
            notes: null,
            distractions: [],
            timestamp: Date.now()
          });
        }
      }, 300);
    } else {
      setIsActive(false);
      setIsPaused(false);
      setCurrentSession(null);
    }

    generateAIMessage(nextMode === 'work' ? 'work-start' : 'break-start');
  };

  const completeSession = async () => {
    if (!currentSession || !isActive) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    // Update current session
    const endTime = new Date();
    const sessionData = {
      ...currentSession,
      endTime,
      completed: true
    };

    setCurrentSession(sessionData);

    // Track completed session in AI Focus Coach
    if (mode === 'work') {
      aiFocusCoachService.trackCompletedSession({
        duration: currentSession.duration,
        distractions: distractions.length,
        notes: sessionNotes,
        taskName: currentSession.task || undefined
      });

      // Also update the enhanced AI coach with session data
      await enhancedAIFocusCoachService.updateUserProfile({
        completed: true,
        distractions: distractionTypes,
        timeOfDay: getTimeOfDay(),
        duration: currentSession.duration,
        taskType: currentSession.task || undefined
      });
    }

    // Save session to history if it's a work session
    if (mode === 'work') {
      // Update total focus time
      setTotalFocusTime(prev => prev + currentSession.duration);

      // Open feedback modal for work sessions
      if (!settings.autoStartBreaks) {
        // In a full implementation, we would show a modal for feedback
        // For now, we'll just skip to the next mode
        skipToNextMode();
      } else {
        skipToNextMode();
      }
    } else {
      // If it's a break, just move to the next mode
      skipToNextMode();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateAIMessage = async (context: string) => {
    setIsAiLoading(true);

    try {
      let message: string;

      // Get message from AI Focus Coach
      switch (context) {
        case 'session-start':
          message = aiFocusCoachService.generateCoachMessage('session-start');
          break;
        case 'pause':
          message = aiFocusCoachService.generateCoachMessage('distraction');
          break;
        case 'reset':
          message = aiFocusCoachService.generateCoachMessage('reset');
          break;
        case 'work-start':
          message = aiFocusCoachService.generateCoachMessage('session-start');
          break;
        case 'break-start':
          message = aiFocusCoachService.generateCoachMessage('break-start');
          break;
        default:
          message = aiFocusCoachService.generateCoachMessage('encouragement');
      }

      setAiMessage(message);
    } catch (error) {
      console.error('Error generating AI message:', error);
      setAiMessage("Let's stay focused on our task!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddDistraction = (distractionType: string) => {
    if (!currentSession) return;

    const newDistraction: Distraction = {
      type: distractionType,
      notes: currentDistraction.notes,
      timestamp: Date.now()
    };

    setDistractions(prev => [...prev, newDistraction]);

    // Track distraction in AI Focus Coach
    aiFocusCoachService.trackDistraction(distractionType);

    // Also update enhanced AI coach
    enhancedAIFocusCoachService.updateUserProfile({
      completed: false,
      distractions: [distractionType],
      timeOfDay: getTimeOfDay(),
      duration: 0
    });

    // Reset current distraction
    setCurrentDistraction({ type: '', notes: '' });

    // Close modal
    setShowDistractionModal(false);

    // Resume timer if paused
    if (isPaused) {
      setIsPaused(false);
    }
  };

  const handleKeyboardControl = (e: React.KeyboardEvent) => {
    // Space = toggle timer
    if (e.code === 'Space' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      if (!isActive || isPaused) {
        startTimer();
      } else {
        pauseTimer();
      }
    }

    // Ctrl+Left = reset
    if (e.code === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      resetTimer();
    }

    // Ctrl+Right = skip
    if (e.code === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      skipToNextMode();
    }
  };

  const handleAdjustTimer = (newDuration: number) => {
    if (isActive) return; // Don't adjust during active session

    const currentMode = mode;

    if (currentMode === 'work') {
      setSettings(prev => ({ ...prev, workDuration: newDuration }));
    } else if (currentMode === 'shortBreak') {
      setSettings(prev => ({ ...prev, shortBreakDuration: newDuration }));
    } else {
      setSettings(prev => ({ ...prev, longBreakDuration: newDuration }));
    }

    setTimeRemaining(newDuration * 60);

    // Save settings
    localStorage.setItem('pomodoroSettings', JSON.stringify({
      ...settings,
      [currentMode === 'work' ? 'workDuration' :
        currentMode === 'shortBreak' ? 'shortBreakDuration' : 'longBreakDuration']: newDuration
    }));
  };

  // Calculate today's total pomodoros
  const todayPomodoros = sessionHistory.filter(session => {
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    return sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear();
  }).length;

  // Get current mode duration for AI Coach
  const getCurrentDuration = () => {
    if (mode === 'work') return settings.workDuration;
    if (mode === 'shortBreak') return settings.shortBreakDuration;
    return settings.longBreakDuration;
  };

  // Extract distraction types for AI Coach
  const distractionTypes = distractions.map(d => d.type);

  // Helper function to get time of day
  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div
      className={`flex flex-col h-full p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}
      onKeyDown={handleKeyboardControl}
      tabIndex={0}
    >
      <div className="flex flex-1 gap-4">
        {/* Main Pomodoro Column */}
        <div className="flex flex-col flex-1">
          <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-4`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <LucideIcons.Timer className="h-5 w-5" />
                <h2 className="text-xl font-bold">Enhanced Pomodoro Timer</h2>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                aria-label="Settings"
              >
                <LucideIcons.Settings className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex justify-center mb-6">
              <div className={`grid grid-cols-3 rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <button
                  onClick={() => {
                    if (!isActive) {
                      setMode('work');
                      setTimeRemaining(settings.workDuration * 60);
                    }
                  }}
                  className={`px-4 py-2 text-center ${mode === 'work'
                      ? darkMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-500 text-white'
                      : ''
                    }`}
                >
                  Pomodoro
                </button>
                <button
                  onClick={() => {
                    if (!isActive) {
                      setMode('shortBreak');
                      setTimeRemaining(settings.shortBreakDuration * 60);
                    }
                  }}
                  className={`px-4 py-2 text-center ${mode === 'shortBreak'
                      ? darkMode
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 text-white'
                      : ''
                    }`}
                >
                  Short Break
                </button>
                <button
                  onClick={() => {
                    if (!isActive) {
                      setMode('longBreak');
                      setTimeRemaining(settings.longBreakDuration * 60);
                    }
                  }}
                  className={`px-4 py-2 text-center ${mode === 'longBreak'
                      ? darkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : ''
                    }`}
                >
                  Long Break
                </button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className={`font-mono text-6xl font-bold mb-4 ${mode === 'work'
                  ? 'text-indigo-500'
                  : mode === 'shortBreak'
                    ? 'text-green-500'
                    : 'text-blue-500'
                }`}>
                {formatTime(timeRemaining)}
              </div>

              {/* Task Display */}
              {selectedTask && (
                <div className="text-lg mb-4 opacity-75">
                  Current Task: <span className="font-medium">{selectedTask}</span>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                {/* Start/Pause Button */}
                {(!isActive || isPaused) ? (
                  <button
                    onClick={startTimer}
                    className={`flex items-center justify-center p-3 rounded-full ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
                      } text-white shadow`}
                    aria-label="Start timer"
                  >
                    <LucideIcons.Play className="h-6 w-6" />
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className={`flex items-center justify-center p-3 rounded-full ${darkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'
                      } text-white shadow`}
                    aria-label="Pause timer"
                  >
                    <LucideIcons.Pause className="h-6 w-6" />
                  </button>
                )}

                {/* Reset Button */}
                <button
                  onClick={resetTimer}
                  className={`flex items-center justify-center p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'
                    } shadow`}
                  disabled={!isActive && timeRemaining === (
                    mode === 'work'
                      ? settings.workDuration
                      : mode === 'shortBreak'
                        ? settings.shortBreakDuration
                        : settings.longBreakDuration
                  ) * 60}
                  aria-label="Reset timer"
                >
                  <LucideIcons.RotateCcw className="h-6 w-6" />
                </button>

                {/* Skip Button */}
                <button
                  onClick={skipToNextMode}
                  className={`flex items-center justify-center p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'
                    } shadow`}
                  aria-label="Skip to next session"
                >
                  <LucideIcons.SkipForward className="h-6 w-6" />
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center justify-center p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'
                    } shadow`}
                  aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
                >
                  {soundEnabled ? (
                    <LucideIcons.Volume2 className="h-6 w-6" />
                  ) : (
                    <LucideIcons.VolumeX className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Session Counter */}
            <div className="flex justify-center items-center mb-4">
              <div className="flex items-center space-x-1">
                {[...Array(settings.longBreakInterval)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${index < (cycles % settings.longBreakInterval)
                        ? 'bg-indigo-500'
                        : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="ml-3 text-sm opacity-75">
                {cycles % settings.longBreakInterval} / {settings.longBreakInterval} sessions
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <h3 className="font-semibold mb-3">Timer Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm">
                          Pomodoro Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={settings.workDuration}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) return;

                            setSettings(prev => ({ ...prev, workDuration: value }));
                            if (mode === 'work' && !isActive) {
                              setTimeRemaining(value * 60);
                            }
                          }}
                          className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                            }`}
                          aria-label="Set pomodoro duration in minutes"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Short Break Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={settings.shortBreakDuration}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) return;

                            setSettings(prev => ({ ...prev, shortBreakDuration: value }));
                            if (mode === 'shortBreak' && !isActive) {
                              setTimeRemaining(value * 60);
                            }
                          }}
                          className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                            }`}
                          aria-label="Set short break duration in minutes"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Long Break Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.longBreakDuration}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) return;

                            setSettings(prev => ({ ...prev, longBreakDuration: value }));
                            if (mode === 'longBreak' && !isActive) {
                              setTimeRemaining(value * 60);
                            }
                          }}
                          className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                            }`}
                          aria-label="Set long break duration in minutes"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Long Break Interval (sessions)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.longBreakInterval}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) return;

                            setSettings(prev => ({ ...prev, longBreakInterval: value }));
                          }}
                          className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                            }`}
                          aria-label="Set number of pomodoros before a long break"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm">
                          Daily Goal (pomodoros)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.dailyGoal}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) return;

                            setSettings(prev => ({ ...prev, dailyGoal: value }));
                          }}
                          className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                            }`}
                          aria-label="Set daily goal in number of pomodoros"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.autoStartBreaks}
                            onChange={(e) => setSettings(prev => ({ ...prev, autoStartBreaks: e.target.checked }))}
                            className="mr-2"
                            aria-label="Auto-start breaks"
                          />
                          <span className="text-sm">Auto-start breaks</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.autoStartPomodoros}
                            onChange={(e) => setSettings(prev => ({ ...prev, autoStartPomodoros: e.target.checked }))}
                            className="mr-2"
                            aria-label="Auto-start pomodoros"
                          />
                          <span className="text-sm">Auto-start pomodoros</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
                          setShowSettings(false);
                        }}
                        className={`px-4 py-2 rounded ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
                          } text-white`}
                        aria-label="Save settings"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Task Selection */}
          <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-4`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <LucideIcons.Target className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Select a Task</h3>
              </div>
              <button
                onClick={() => {
                  if (customTask.trim()) {
                    const newTask = {
                      id: Date.now(),
                      text: customTask.trim()
                    };
                    setTasks(prev => [...prev, newTask]);
                    setCustomTask("");
                  }
                }}
                disabled={!customTask.trim()}
                className={`p-2 rounded-full ${customTask.trim() ? (darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600') :
                    (darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                  } text-white`}
                aria-label="Add new task"
              >
                <LucideIcons.Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={customTask}
                onChange={(e) => setCustomTask(e.target.value)}
                placeholder="Add a new task..."
                className={`w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500'
                  }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTask.trim()) {
                    const newTask = {
                      id: Date.now(),
                      text: customTask.trim()
                    };
                    setTasks(prev => [...prev, newTask]);
                    setCustomTask("");
                  }
                }}
                aria-label="Enter a new task"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedTask === task.text
                      ? darkMode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 text-indigo-800'
                      : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  onClick={() => setSelectedTask(task.text)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTask(task.text);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <div className="flex-1 truncate">{task.text}</div>
                  {selectedTask === task.text && (
                    <LucideIcons.CheckCircle className="h-5 w-5 ml-2 text-indigo-200" />
                  )}
                </div>
              ))}

              {tasks.length === 0 && (
                <div className={`p-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No tasks added yet. Add a task to get started.
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center gap-2 mb-4">
              <LucideIcons.Zap className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Your Progress</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="text-sm opacity-75">Today</div>
                <div className="text-2xl font-bold">{sessionStats.today}</div>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="text-sm opacity-75">This Week</div>
                <div className="text-2xl font-bold">{sessionStats.week}</div>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="text-sm opacity-75">This Month</div>
                <div className="text-2xl font-bold">{sessionStats.month}</div>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="text-sm opacity-75">Total</div>
                <div className="text-2xl font-bold">{sessionStats.total}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Current Streak: <span className="font-semibold">{currentStreak}</span> days
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Longest Streak: <span className="font-semibold">{longestStreak}</span> days
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Daily Goal: {completedSessions} / {settings.dailyGoal} Pomodoros
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {Math.round((completedSessions / settings.dailyGoal) * 100)}%
                </div>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`progress-bar h-2 rounded-full`}
                  style={{ width: `${Math.min(100, (completedSessions / settings.dailyGoal) * 100)}%` }}
                  role="progressbar"
                  aria-label={`${completedSessions} out of ${settings.dailyGoal} pomodoros completed`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar with AI Coach */}
        <div className="w-1/3 flex flex-col gap-4">
          <EnhancedAICoach
            isActive={isActive}
            isPaused={isPaused}
            mode={mode}
            duration={getCurrentDuration()}
            timeRemaining={timeRemaining}
            cycles={cycles}
            todayPomodoros={todayPomodoros}
            distractions={distractionTypes}
            currentTask={selectedTask || undefined}
            onAddDistraction={handleAddDistraction}
            onAdjustTimer={handleAdjustTimer}
            onStartSession={startTimer}
            darkMode={darkMode}
            className="flex-1"
          />

          {/* Session History */}
          <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <LucideIcons.History className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Recent Sessions</h3>
              </div>
              <button
                onClick={() => setShowSessionHistory(!showSessionHistory)}
                className={`text-sm ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
              >
                {showSessionHistory ? 'Hide' : 'View All'}
              </button>
            </div>

            <AnimatePresence>
              {showSessionHistory ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                  id="session-history-panel"
                >
                  <div className="max-h-96 overflow-y-auto pr-2">
                    {sessionHistory.length > 0 ? (
                      <div className="space-y-3">
                        {sessionHistory.slice(0, 10).map((session, index) => (
                          <div
                            key={session.id || index}
                            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {session.task || 'Unnamed Session'}
                                </div>
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(session.startTime).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className={`text-sm font-medium ${session.mode === 'work'
                                  ? 'text-indigo-500'
                                  : session.mode === 'shortBreak'
                                    ? 'text-green-500'
                                    : 'text-blue-500'
                                }`}>
                                {session.duration} min
                              </div>
                            </div>

                            {(session.notes || (session.distractions && session.distractions.length > 0)) && (
                              <button
                                onClick={() => {
                                  setSelectedSessionNotes({
                                    notes: session.notes,
                                    task: session.task
                                  });
                                  setShowNotesModal(true);
                                }}
                                className={`mt-2 text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                                aria-label={`View notes for ${session.task || 'session'}`}
                              >
                                View Notes
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No session history yet. Complete a session to see it here.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {sessionHistory.slice(0, 3).map((session, index) => (
                    <div
                      key={session.id || index}
                      className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium truncate max-w-[180px]">
                            {session.task || 'Unnamed Session'}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(session.startTime).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${session.mode === 'work'
                            ? 'text-indigo-500'
                            : session.mode === 'shortBreak'
                              ? 'text-green-500'
                              : 'text-blue-500'
                          }`}>
                          {session.duration} min
                        </div>
                      </div>
                    </div>
                  ))}

                  {sessionHistory.length === 0 && (
                    <div className={`p-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No session history yet. Complete a session to see it here.
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Distraction Modal */}
      <AnimatePresence>
        {showDistractionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Log a Distraction</h3>
                <button
                  onClick={() => setShowDistractionModal(false)}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  aria-label="Close dialog"
                >
                  <LucideIcons.X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">
                  What distracted you?
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['Social Media', 'Notification', 'Colleague', 'Thoughts', 'Hunger', 'Noise'].map(type => (
                    <button
                      key={type}
                      onClick={() => setCurrentDistraction(prev => ({ ...prev, type }))}
                      className={`p-2 rounded text-sm ${currentDistraction.type === type
                          ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                          : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or type your own..."
                  value={currentDistraction.type !== '' && !['Social Media', 'Notification', 'Colleague', 'Thoughts', 'Hunger', 'Noise'].includes(currentDistraction.type)
                    ? currentDistraction.type
                    : ''}
                  onChange={(e) => setCurrentDistraction(prev => ({ ...prev, type: e.target.value }))}
                  className={`w-full px-3 py-2 rounded mb-4 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500'
                    }`}
                  aria-label="Enter a custom distraction type"
                />

                <label className="block mb-2 text-sm font-medium">
                  Additional notes (optional)
                </label>
                <textarea
                  value={currentDistraction.notes}
                  onChange={(e) => setCurrentDistraction(prev => ({ ...prev, notes: e.target.value }))}
                  className={`w-full px-3 py-2 rounded h-24 resize-none ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500'
                    }`}
                  placeholder="What happened? How might you prevent this in the future?"
                  aria-label="Additional notes about the distraction"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDistractionModal(false)}
                  className={`px-4 py-2 rounded mr-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddDistraction(currentDistraction.type || 'Other')}
                  disabled={!currentDistraction.type}
                  className={`px-4 py-2 rounded ${currentDistraction.type
                      ? darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
                      : darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
                    } text-white`}
                  aria-label="Log distraction"
                >
                  Log Distraction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotesModal && selectedSessionNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Session Notes</h3>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  aria-label="Close dialog"
                >
                  <LucideIcons.X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="font-medium mb-2">{selectedSessionNotes.task || 'Unnamed Session'}</div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
                  {selectedSessionNotes.notes ? (
                    <p className="whitespace-pre-wrap">{selectedSessionNotes.notes}</p>
                  ) : (
                    <p className="italic opacity-75">No notes were added for this session.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className={`px-4 py-2 rounded ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
                    } text-white`}
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedPomodoro;