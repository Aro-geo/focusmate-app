import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Brain, Loader } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useDeepSeek } from '../hooks/useDeepSeek';

interface AIAnalyticsProps {
  tasks: any[];
  pomodoroSessions: any[];
  journalEntries: any[];
}

const AIAnalytics: React.FC<AIAnalyticsProps> = ({ tasks, pomodoroSessions, journalEntries }) => {
  const { darkMode } = useTheme();
  const { isLoading, generateStreamResponse, streamContent, clearStream } = useDeepSeek();
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    clearStream();
    setAnalysis('');

    const dataContext = `
    Tasks: ${tasks.length} total, ${tasks.filter(t => t.completed).length} completed
    Pomodoro Sessions: ${pomodoroSessions.length} sessions, avg duration: ${
      pomodoroSessions.length > 0 
        ? Math.round(pomodoroSessions.reduce((sum, s) => sum + s.duration, 0) / pomodoroSessions.length)
        : 0
    } minutes
    Journal Entries: ${journalEntries.length} entries
    Recent Mood Trends: ${journalEntries.slice(-5).map(e => e.mood).join(', ')}
    `;

    try {
      let fullAnalysis = '';
      await generateStreamResponse(
        `Analyze this productivity data and provide insights, patterns, and actionable recommendations: ${dataContext}`,
        'analysis',
        (chunk) => {
          fullAnalysis += chunk;
          setAnalysis(fullAnalysis);
        }
      );
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis('Unable to generate analysis at this time. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 || pomodoroSessions.length > 0 || journalEntries.length > 0) {
      generateAnalysis();
    }
  }, [tasks.length, pomodoroSessions.length, journalEntries.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl shadow-lg ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            AI Analytics
          </h3>
        </div>
        <motion.button
          onClick={generateAnalysis}
          disabled={isLoading || isAnalyzing}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            darkMode
              ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading || isAnalyzing ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      <div className={`min-h-[200px] p-4 rounded-lg ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
      }`}>
        {isAnalyzing && !analysis ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Analyzing your productivity data...
              </span>
            </div>
          </div>
        ) : (
          <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {analysis || 'No analysis available. Add some tasks, complete Pomodoro sessions, or write journal entries to get AI-powered insights.'}
            {isAnalyzing && (
              <motion.div
                className="inline-block w-2 h-4 bg-current ml-1"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
          <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
            {tasks.filter(t => t.completed).length}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Completed Tasks
          </div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
          <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
            {pomodoroSessions.length}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Focus Sessions
          </div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
          <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
            {journalEntries.length}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Journal Entries
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIAnalytics;