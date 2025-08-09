import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Lightbulb, Loader } from 'lucide-react';
import useAI from '../hooks/useAI';

const AIFeatureDemo: React.FC = () => {
  const { isLoading, error, analyzeTask, getProductivityTip, clearError } = useAI();
  const [taskInput, setTaskInput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [tip, setTip] = useState<string>('');

  const handleAnalyzeTask = async () => {
    if (!taskInput.trim()) return;
    
    try {
      const result = await analyzeTask(taskInput);
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleGetTip = async () => {
    try {
      const result = await getProductivityTip();
      setTip(result);
    } catch (err) {
      console.error('Tip failed:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Features Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Test the AI-powered features of FocusMate
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
        >
          <p>{error}</p>
          <button
            onClick={clearError}
            className="text-sm underline hover:no-underline mt-1"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Task Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Analysis
          </h3>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Enter a task to analyze..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          
          <button
            onClick={handleAnalyzeTask}
            disabled={!taskInput.trim() || isLoading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Analyze Task
          </button>

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analysis Result:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>AI Analysis:</strong> {analysis.analysis}</p>
                <p><strong>Complexity:</strong> {analysis.complexity}</p>
                <p><strong>Estimated Time:</strong> {analysis.estimatedTime} minutes</p>
                <p><strong>Priority:</strong> {analysis.priority}</p>
                <div>
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Productivity Tip */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Productivity Tip
          </h3>
        </div>
        
        <button
          onClick={handleGetTip}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Lightbulb className="w-4 h-4 mr-2" />
          )}
          Get Productivity Tip
        </button>

        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <p className="text-gray-800 dark:text-gray-200">{tip}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIFeatureDemo;