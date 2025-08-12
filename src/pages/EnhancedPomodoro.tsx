import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, MessageCircle, Plus, CheckCircle, Award, Zap, Bell, BellOff, Palette, Calendar, Target, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import FocusNowButton from '../components/FocusNowButton';
import SessionChat from '../components/SessionChat';
import DatabasePomodoroService from '../services/DatabasePomodoroService';
import { useAuth } from '../context/AuthContext';

const EnhancedPomodoro: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  
  // Timer state
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [currentTime, setCurrentTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [cycles, setCycles] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Task integration
  const [currentTask, setCurrentTask] = useState<string>('');
  const [taskList, setTaskList] = useState<string[]>(['Complete project proposal', 'Review code', 'Team meeting prep']);
  const [newTask, setNewTask] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  
  // Notes and distractions
  const [sessionNotes, setSessionNotes] = useState('');
  const [distractions, setDistractions] = useState<string[]>([]);
  const [newDistraction, setNewDistraction] = useState('');
  
  // Stats and gamification
  const [todayPomodoros, setTodayPomodoros] = useState(0);
  const [weekPomodoros, setWeekPomodoros] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [theme, setTheme] = useState<'default' | 'forest' | 'ocean' | 'sunset'>('default');
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  
  // Session state
  const [sessionMode, setSessionMode] = useState<'work' | 'moving' | 'anything'>('work');
  const [quietMode, setQuietMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(true);
  
  const currentUser = { id: user?.id || 'user-1', fullName: user?.name || 'You' };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    }
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const saveSession = async () => {
    if (sessionStartTime && mode === 'work') {
      try {
        await DatabasePomodoroService.saveSession({
          taskName: currentTask || 'Focus Session',
          startTime: sessionStartTime,
          endTime: new Date(),
          durationMinutes: workDuration,
          sessionType: 'pomodoro',
          completed: true,
          notes: sessionNotes
        });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  const completeSession = useCallback(async () => {
    playNotificationSound();
    
    if (mode === 'work') {
      await saveSession();
      const newCycles = cycles + 1;
      setCycles(newCycles);
      setTodayPomodoros(prev => prev + 1);
      setWeekPomodoros(prev => prev + 1);
      
      // Check for badges
      if (newCycles === 1) setBadges(prev => [...prev, 'First Pomodoro']);
      if (newCycles === 10) setBadges(prev => [...prev, 'Focused Achiever']);
      if (todayPomodoros + 1 === 8) setBadges(prev => [...prev, 'Daily Champion']);
      
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      
      const nextMode = newCycles % cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setCurrentTime(nextMode === 'longBreak' ? longBreakDuration * 60 : shortBreakDuration * 60);
      
      showNotification('Pomodoro Complete!', `Great job! Time for a ${nextMode === 'longBreak' ? 'long' : 'short'} break.`);
      
      if (autoStartBreaks) {
        setTimeout(() => setIsActive(true), 1000);
      }
    } else {
      setMode('work');
      setCurrentTime(workDuration * 60);
      showNotification('Break Over!', 'Ready to focus again?');
      
      if (autoStartPomodoros) {
        setTimeout(() => setIsActive(true), 1000);
      }
    }
    
    setIsActive(false);
    setSessionStartTime(null);
    setSessionNotes('');
  }, [mode, cycles, workDuration, shortBreakDuration, longBreakDuration, soundEnabled, notificationsEnabled, cyclesBeforeLongBreak, autoStartBreaks, autoStartPomodoros, currentTask, sessionNotes, sessionStartTime, todayPomodoros]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && currentTime > 0) {
      interval = setInterval(() => {
        setCurrentTime(currentTime => currentTime - 1);
      }, 1000);
    } else if (currentTime === 0) {
      completeSession();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentTime, completeSession]);

  // Duration effect
  useEffect(() => {
    if (!isActive) {
      if (mode === 'work') {
        setCurrentTime(workDuration * 60);
      } else if (mode === 'shortBreak') {
        setCurrentTime(shortBreakDuration * 60);
      } else {
        setCurrentTime(longBreakDuration * 60);
      }
    }
  }, [workDuration, shortBreakDuration, longBreakDuration, mode, isActive]);

  const toggleTimer = () => {
    if (!isActive && !isPaused) {
      setSessionStartTime(new Date());
    }
    setIsActive(!isActive);
    setIsPaused(isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') {
      setCurrentTime(workDuration * 60);
    } else if (mode === 'shortBreak') {
      setCurrentTime(shortBreakDuration * 60);
    } else {
      setCurrentTime(longBreakDuration * 60);
    }
  };

  const skipSession = () => {
    completeSession();
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTaskList(prev => [...prev, newTask.trim()]);
      setNewTask('');
      setShowTaskInput(false);
    }
  };

  const addDistraction = () => {
    if (newDistraction.trim()) {
      setDistractions(prev => [...prev, newDistraction.trim()]);
      setNewDistraction('');
    }
  };

  const getThemeColors = () => {
    const themes = {
      default: { bg: 'from-blue-50 to-indigo-100', accent: 'blue' },
      forest: { bg: 'from-green-50 to-emerald-100', accent: 'green' },
      ocean: { bg: 'from-cyan-50 to-blue-100', accent: 'cyan' },
      sunset: { bg: 'from-orange-50 to-pink-100', accent: 'orange' }
    };
    return themes[theme];
  };

  const getTimerColor = () => {
    const { accent } = getThemeColors();
    if (mode === 'work') return `text-${accent}-600`;
    if (mode === 'shortBreak') return 'text-green-500';
    return 'text-blue-500';
  };

  const getProgress = () => {
    const totalTime = mode === 'work' ? workDuration * 60 : 
                     mode === 'shortBreak' ? shortBreakDuration * 60 : 
                     longBreakDuration * 60;
    return ((totalTime - currentTime) / totalTime) * 100;
  };

  const startCustomSession = useCallback((duration: number, taskMode: string) => {
    setWorkDuration(duration);
    setSessionMode(taskMode as 'work' | 'moving' | 'anything');
    setCurrentTime(duration * 60);
    setMode('work');
    setIsActive(true);
    setShowChat(true);
    setChatMinimized(false);
  }, []);

  const sessionModeIcons = {
    work: '💻',
    moving: '🚶',
    anything: '✨'
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : `bg-gradient-to-br ${getThemeColors().bg}`
    } p-6`}>
      
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-6xl animate-bounce">🎉</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Enhanced Focus Timer
          </h1>
          <p className={`mb-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {mode === 'work' ? 'Time to focus!' : mode === 'shortBreak' ? 'Take a short break' : 'Long break time!'}
          </p>
          
          {/* Stats Bar */}
          <div className="flex justify-center gap-6 text-sm">
            <div className={`flex items-center gap-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Target className="w-4 h-4" />
              Today: {todayPomodoros}
            </div>
            <div className={`flex items-center gap-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Zap className="w-4 h-4" />
              Streak: {streak}
            </div>
            <div className={`flex items-center gap-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Award className="w-4 h-4" />
              Badges: {badges.length}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timer Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`lg:col-span-2 rounded-3xl shadow-xl p-8 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Session Info */}
            {isActive && (
              <div className={`text-center mb-6 p-4 rounded-xl ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{sessionModeIcons[sessionMode]}</span>
                  <span className={`text-sm font-medium capitalize ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {sessionMode} Session
                  </span>
                  {quietMode && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Quiet Mode</span>}
                </div>
                <button
                  onClick={() => setShowChat(true)}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1 mx-auto"
                >
                  <MessageCircle className="w-3 h-3" />
                  Open Session Chat
                </button>
              </div>
            )}

            {/* Current Task Display */}
            {currentTask && (
              <div className={`text-center mb-6 p-4 rounded-xl ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className={`text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Current Task
                </div>
                <div className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {currentTask}
                </div>
              </div>
            )}

            {/* Circular Progress Timer */}
            <div className="text-center mb-8">
              <div className="relative w-64 h-64 mx-auto mb-6">
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
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-4xl font-mono font-bold ${
                    darkMode ? 'text-white' : getTimerColor()
                  }`}>
                    {formatTime(currentTime)}
                  </div>
                  <div className={`text-sm mt-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Focus Time'}
                  </div>
                </div>
              </div>
              
              {/* Cycle Progress */}
              <div className={`text-sm mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Cycle {cycles + 1} • {cycles % cyclesBeforeLongBreak + 1}/{cyclesBeforeLongBreak} until long break
              </div>
              
              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-6">
                {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < cycles % cyclesBeforeLongBreak
                        ? 'bg-green-500'
                        : i === cycles % cyclesBeforeLongBreak && mode === 'work' && isActive
                        ? 'bg-blue-500 animate-pulse'
                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTimer}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                  isActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isActive ? 'Pause' : isPaused ? 'Resume' : 'Start'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetTimer}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={skipSession}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <SkipForward className="w-5 h-5" />
                Skip
              </motion.button>
            </div>

            {/* Quick Controls */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-lg transition-all ${
                  soundEnabled 
                    ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                    : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-400')
                }`}
                title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-3 rounded-lg transition-all ${
                  notificationsEnabled 
                    ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600')
                    : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-400')
                }`}
                title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-lg transition-all ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl p-6 mt-6 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <h3 className={`font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Settings</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Timer Settings */}
                    <div className="space-y-4">
                      <h4 className={`font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Timer</h4>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Work Duration: {workDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="60"
                          value={workDuration}
                          onChange={(e) => setWorkDuration(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Short Break: {shortBreakDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          value={shortBreakDuration}
                          onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Long Break: {longBreakDuration} minutes
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="45"
                          value={longBreakDuration}
                          onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Cycles before long break: {cyclesBeforeLongBreak}
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="8"
                          value={cyclesBeforeLongBreak}
                          onChange={(e) => setCyclesBeforeLongBreak(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    {/* Automation & Theme Settings */}
                    <div className="space-y-4">
                      <h4 className={`font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Automation</h4>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={autoStartBreaks}
                          onChange={(e) => setAutoStartBreaks(e.target.checked)}
                          className="rounded"
                        />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Auto-start breaks</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={autoStartPomodoros}
                          onChange={(e) => setAutoStartPomodoros(e.target.checked)}
                          className="rounded"
                        />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Auto-start pomodoros</span>
                      </label>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          Theme
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className={`w-full p-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="default">Default</option>
                          <option value="forest">Forest</option>
                          <option value="ocean">Ocean</option>
                          <option value="sunset">Sunset</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Right Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Task Selection */}
            <div className={`rounded-2xl shadow-lg p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <Target className="w-5 h-5" />
                Current Task
              </h3>
              
              <select
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                className={`w-full p-3 rounded-lg border mb-3 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select a task...</option>
                {taskList.map((task, index) => (
                  <option key={index} value={task}>{task}</option>
                ))}
              </select>
              
              {showTaskInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter new task..."
                    className={`flex-1 p-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <button
                    onClick={addTask}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTaskInput(true)}
                  className={`w-full p-2 rounded-lg border-2 border-dashed transition-all ${
                    darkMode 
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500'
                      : 'border-gray-300 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add New Task
                </button>
              )}
            </div>
            
            {/* Session Notes */}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl shadow-lg p-6 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <h3 className={`font-semibold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>Session Notes</h3>
                
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Jot down thoughts, ideas, or distractions..."
                  className={`w-full p-3 rounded-lg border h-24 resize-none ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                
                <div className="mt-3">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newDistraction}
                      onChange={(e) => setNewDistraction(e.target.value)}
                      placeholder="Log a distraction..."
                      className={`flex-1 p-2 text-sm rounded border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && addDistraction()}
                    />
                    <button
                      onClick={addDistraction}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                      Log
                    </button>
                  </div>
                  
                  {distractions.length > 0 && (
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Distractions: {distractions.length}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Daily Stats */}
            <div className={`rounded-2xl shadow-lg p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <Award className="w-5 h-5" />
                Today's Progress
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Pomodoros</span>
                  <span className={`font-bold ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>{todayPomodoros}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Focus Time</span>
                  <span className={`font-bold ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>{todayPomodoros * workDuration}m</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Streak</span>
                  <span className={`font-bold ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>{streak} days</span>
                </div>
              </div>
              
              {badges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Recent Badges</div>
                  <div className="flex flex-wrap gap-1">
                    {badges.slice(-3).map((badge, index) => (
                      <span
                        key={index}
                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                      >
                        🏆 {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Session Chat */}
      {showChat && (
        <SessionChat
          sessionId="current-session"
          currentUser={currentUser}
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        />
      )}
    </div>
  );
};

export default EnhancedPomodoro;