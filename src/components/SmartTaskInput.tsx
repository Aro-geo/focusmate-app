import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Clock, Tag, Calendar } from 'lucide-react';
import PersonalizedAIService from '../services/PersonalizedAIService';

interface SmartTaskInputProps {
  onTaskCreated: (task: any) => void;
  userId: string;
}

const SmartTaskInput: React.FC<SmartTaskInputProps> = ({ onTaskCreated, userId }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    try {
      const taskAnalysis = await PersonalizedAIService.analyzeTaskFromNaturalLanguage(input);
      setAnalysis(taskAnalysis);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Task analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTask = () => {
    if (!analysis) return;

    const task = {
      title: input,
      category: analysis.category,
      priority: analysis.priority,
      estimatedDuration: analysis.estimatedDuration,
      deadline: analysis.deadline,
      subtasks: analysis.subtasks,
      tags: analysis.tags,
      userId,
      completed: false,
      createdAt: new Date()
    };

    onTaskCreated(task);
    setInput('');
    setAnalysis(null);
    setShowAnalysis(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Smart Task Assistant</h3>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your task naturally... e.g., 'Finish project report by Friday'"
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <motion.button
            onClick={handleAnalyze}
            disabled={!input.trim() || isAnalyzing}
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAnalyzing ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {showAnalysis && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700"
          >
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">AI Analysis</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Category: <span className="font-medium">{analysis.category}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  analysis.priority === 'high' ? 'bg-red-500' :
                  analysis.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Priority: <span className="font-medium capitalize">{analysis.priority}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Est. Time: <span className="font-medium">{analysis.estimatedDuration}min</span>
                </span>
              </div>
              
              {analysis.deadline && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Deadline: <span className="font-medium">{analysis.deadline.toLocaleDateString()}</span>
                  </span>
                </div>
              )}
            </div>

            {analysis.subtasks.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Subtasks:</h5>
                <div className="space-y-1">
                  {analysis.subtasks.map((subtask: string, index: number) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      <span>{subtask}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <motion.button
                onClick={handleCreateTask}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </motion.button>
              
              <button
                onClick={() => setShowAnalysis(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SmartTaskInput;