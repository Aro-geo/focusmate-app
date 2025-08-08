import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CheckCircle, Smile, Meh, Frown, Copy, Share } from 'lucide-react';
import PersonalizedAIService from '../services/PersonalizedAIService';

interface SessionSummaryProps {
  sessionData: {
    duration: number;
    tasksCompleted: string[];
    mood: string;
    notes?: string;
  };
  onClose: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ sessionData, onClose }) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateSummary = async () => {
      setIsLoading(true);
      try {
        const aiSummary = await PersonalizedAIService.generateSessionSummary(sessionData);
        setSummary(aiSummary);
      } catch (error) {
        setSummary('Great focus session! Keep up the productive momentum.');
      } finally {
        setIsLoading(false);
      }
    };

    generateSummary();
  }, [sessionData]);

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'great': return Smile;
      case 'okay': return Meh;
      case 'tired': return Frown;
      default: return Meh;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'great': return 'text-green-500';
      case 'okay': return 'text-yellow-500';
      case 'tired': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const copyToClipboard = () => {
    const text = `Focus Session Summary:\n${summary}\n\nDuration: ${sessionData.duration} minutes\nTasks: ${sessionData.tasksCompleted.join(', ')}\nMood: ${sessionData.mood}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Session Complete!</h2>
          <p className="text-gray-600 dark:text-gray-300">Here's your AI-powered summary</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-gray-800 dark:text-white">{sessionData.duration}min</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-gray-800 dark:text-white">{sessionData.tasksCompleted.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              {React.createElement(getMoodIcon(sessionData.mood), {
                className: `w-5 h-5 ${getMoodColor(sessionData.mood)} mx-auto mb-1`
              })}
              <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">{sessionData.mood}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mood</p>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-gray-800 dark:text-white">AI Insights</h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Generating insights...</span>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{summary}</p>
            )}
          </div>

          {/* Completed Tasks */}
          {sessionData.tasksCompleted.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Tasks Completed:</h4>
              <div className="space-y-1">
                {sessionData.tasksCompleted.map((task, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {sessionData.notes && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Notes:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                {sessionData.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <motion.button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </motion.button>
          
          <motion.button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionSummary;