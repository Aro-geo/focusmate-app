import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Coffee,
  Brain,
  Timer,
  Target,
  Trophy,
  TrendingUp,
  Volume2,
  VolumeX,
  Vibrate
} from 'lucide-react';

interface MobilePomodoroProps {
  onComplete?: () => void;
}

const MobilePomodoro: React.FC<MobilePomodoroProps> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    vibrationEnabled: true
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    const totalTime = isBreak 
      ? (sessionCount % settings.sessionsUntilLongBreak === 0 && sessionCount > 0 
          ? settings.longBreak * 60 
          : settings.shortBreak * 60)
      : settings.workTime * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const playSound = () => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Could not play sound:', e));
    }
  };

  const vibrate = () => {
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const startTimer = () => {
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer completed
          playSound();
          vibrate();
          
          if (isBreak) {
            // Break completed, start work session
            setIsBreak(false);
            setTimeLeft(settings.workTime * 60);
          } else {
            // Work session completed
            const newSessionCount = sessionCount + 1;
            setSessionCount(newSessionCount);
            setIsBreak(true);
            
            // Determine break length
            const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0;
            setTimeLeft((isLongBreak ? settings.longBreak : settings.shortBreak) * 60);
          }
          
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(settings.workTime * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const skipSession = () => {
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(settings.workTime * 60);
    } else {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      setIsBreak(true);
      const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0;
      setTimeLeft((isLongBreak ? settings.longBreak : settings.shortBreak) * 60);
    }
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const progress = calculateProgress();
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 p-4">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhASF+zPLadCwH"
        preload="auto"
      />

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isBreak ? 'Break Time' : 'Focus Time'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Session {sessionCount + 1}
            </p>
          </div>
          
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>

        {/* Timer Circle */}
        <div className="relative flex items-center justify-center mb-8">
          <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 240 240">
            {/* Background circle */}
            <circle
              cx="120"
              cy="120"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="120"
              cy="120"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                isBreak 
                  ? 'text-green-500' 
                  : 'text-indigo-500'
              }`}
            />
          </svg>
          
          {/* Timer content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className={`text-5xl font-bold font-mono mb-2 ${
                isBreak 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}>
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                {isBreak ? (
                  <Coffee className="h-5 w-5 text-green-500" />
                ) : (
                  <Brain className="h-5 w-5 text-indigo-500" />
                )}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isBreak ? 'Take a break' : 'Stay focused'}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isBreak ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <motion.button
            onClick={isActive ? pauseTimer : startTimer}
            className={`px-8 py-4 rounded-2xl font-semibold text-white shadow-lg ${
              isActive
                ? 'bg-red-500 hover:bg-red-600'
                : isBreak
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isActive ? (
              <>
                <Pause className="h-6 w-6 mr-2 inline" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-6 w-6 mr-2 inline" />
                Start
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={resetTimer}
            className="px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="h-6 w-6" />
          </motion.button>
          
          <motion.button
            onClick={skipSession}
            className="px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold shadow-lg"
            whileTap={{ scale: 0.95 }}
          >
            <Square className="h-6 w-6" />
          </motion.button>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {sessionCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completed
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
            <Target className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {settings.sessionsUntilLongBreak - (sessionCount % settings.sessionsUntilLongBreak)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Until Break
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-lg">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((sessionCount * settings.workTime) / 60)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Today
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timer Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.workTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, workTime: parseInt(e.target.value) || 25 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="60"
                  placeholder="25"
                  aria-label="Work time in minutes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  value={settings.shortBreak}
                  onChange={(e) => setSettings(prev => ({ ...prev, shortBreak: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="30"
                  placeholder="5"
                  aria-label="Short break time in minutes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  value={settings.longBreak}
                  onChange={(e) => setSettings(prev => ({ ...prev, longBreak: parseInt(e.target.value) || 15 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="60"
                  placeholder="15"
                  aria-label="Long break time in minutes"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sound Notifications
                </span>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                  className={`p-2 rounded-lg ${
                    settings.soundEnabled 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </motion.button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vibration
                </span>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))}
                  className={`p-2 rounded-lg ${
                    settings.vibrationEnabled 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Vibrate className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MobilePomodoro;
