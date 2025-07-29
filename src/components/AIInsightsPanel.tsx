import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  Clock, 
  Zap, 
  TrendingUp, 
  Lightbulb,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { enhancedAIService } from '../services/EnhancedAIService';
import { useTheme } from '../context/ThemeContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_duration?: number;
}

interface AIInsightsPanelProps {
  tasks: Task[];
  currentTask?: Task;
  userState?: any;
  onTaskUpdate?: (taskId: string, updates: any) => void;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  tasks,
  currentTask,
  userState,
  onTaskUpdate
}) => {
  const { darkMode } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskAnalysis, setTaskAnalysis] = useState<any>(null);
  const [prioritizedTasks, setPrioritizedTasks] = useState<any[]>([]);
  const [contextualInsights, setContextualInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'priority' | 'insights'>('analysis');

  // Analyze current task when it changes
  useEffect(() => {
    if (currentTask) {
      analyzeCurrentTask();
    }
  }, [currentTask]);

  // Get prioritized tasks when tasks list changes
  useEffect(() => {
    if (tasks.length > 0) {
      prioritizeTasks();
    }
  }, [tasks]);

  // Get contextual insights periodically
  useEffect(() => {
    getContextualInsights();
    const interval = setInterval(getContextualInsights, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [userState]);

  const analyzeCurrentTask = async () => {
    if (!currentTask) return;

    setIsAnalyzing(true);
    try {
      const analysis = await enhancedAIService.analyzeTask(
        currentTask.title + (currentTask.description ? ` - ${currentTask.description}` : ''),
        userState
      );
      setTaskAnalysis(analysis);

      // Update task with AI insights if callback provided
      if (onTaskUpdate) {
        onTaskUpdate(currentTask.id, {
          estimated_duration: analysis.estimated_duration,
          complexity: analysis.complexity,
          suggested_approach: analysis.suggested_approach
        });
      }
    } catch (error) {
      console.error('Task analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const prioritizeTasks = async () => {
    try {
      const currentTime = new Date().toISOString();
      const userCurrentState = {
        currentTime,
        energy_level: userState?.energy_level || 7,
        mood: userState?.mood || 'focused',
        ...userState
      };

      const prioritized = await enhancedAIService.prioritizeTasks(tasks, userCurrentState);
      setPrioritizedTasks(prioritized.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Task prioritization failed:', error);
    }
  };

  const getContextualInsights = async () => {
    try {
      const context = {
        currentTime: new Date().toISOString(),
        userMood: userState?.mood || 'neutral',
        recentActivity: userState?.recentActivity || [],
        upcomingTasks: tasks.slice(0, 3),
        productivityHistory: userState?.productivityHistory || []
      };

      const insights = await enhancedAIService.getContextualInsights(context);
      setContextualInsights(insights);
    } catch (error) {
      console.error('Contextual insights failed:', error);
    }
  };

  const TabButton: React.FC<{
    tab: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = ({ tab, label, icon, isActive, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
        isActive
          ? darkMode
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500 text-white'
          : darkMode
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 shadow-lg border ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            darkMode ? 'bg-purple-600' : 'bg-purple-500'
          }`}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              AI Productivity Insights
            </h2>
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Intelligent analysis and recommendations
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ rotate: 180 }}
          onClick={() => {
            if (activeTab === 'analysis') analyzeCurrentTask();
            else if (activeTab === 'priority') prioritizeTasks();
            else getContextualInsights();
          }}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <TabButton
          tab="analysis"
          label="Task Analysis"
          icon={<Target className="w-4 h-4" />}
          isActive={activeTab === 'analysis'}
          onClick={() => setActiveTab('analysis')}
        />
        <TabButton
          tab="priority"
          label="Priority"
          icon={<TrendingUp className="w-4 h-4" />}
          isActive={activeTab === 'priority'}
          onClick={() => setActiveTab('priority')}
        />
        <TabButton
          tab="insights"
          label="Insights"
          icon={<Lightbulb className="w-4 h-4" />}
          isActive={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <Brain className="w-8 h-8 text-blue-500" />
                </div>
                <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Analyzing task...
                </span>
              </div>
            ) : taskAnalysis ? (
              <div className="space-y-4">
                {/* Complexity & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Complexity
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className={`text-2xl font-bold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {taskAnalysis.complexity}/10
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Est. Duration
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className={`text-2xl font-bold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {taskAnalysis.estimated_duration}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suggested Approach */}
                <div>
                  <h4 className={`font-medium mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Suggested Approach
                  </h4>
                  <div className="space-y-2">
                    {taskAnalysis.suggested_approach.map((step: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optimal Time Slots */}
                <div>
                  <h4 className={`font-medium mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Optimal Time Slots
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {taskAnalysis.optimal_time_slots.map((slot: string) => (
                      <span key={slot} className={`px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode
                          ? 'bg-blue-600 text-blue-100'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : currentTask ? (
              <div className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Click refresh to analyze the current task</p>
              </div>
            ) : (
              <div className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a task to see AI analysis</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'priority' && (
          <motion.div
            key="priority"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {prioritizedTasks.length > 0 ? (
              <>
                <h4 className={`font-medium mb-3 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Recommended Task Order
                </h4>
                {prioritizedTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-green-500 text-white'
                            : index === 1
                            ? 'bg-yellow-500 text-white'
                            : darkMode
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className={`font-medium text-sm ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {task.reasoning}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          task.priority_score >= 8
                            ? 'text-green-500'
                            : task.priority_score >= 6
                            ? 'text-yellow-500'
                            : 'text-gray-500'
                        }`}>
                          {task.priority_score}
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          score
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Add tasks to see AI prioritization</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {contextualInsights ? (
              <>
                {/* Current Context */}
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className={`font-medium text-sm ${
                      darkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      Current Context
                    </span>
                  </div>
                  <p className={`text-sm ${
                    darkMode ? 'text-blue-200' : 'text-blue-600'
                  }`}>
                    {contextualInsights.current_context}
                  </p>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className={`font-medium mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Smart Recommendations
                  </h4>
                  <div className="space-y-2">
                    {contextualInsights.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optimization Tips */}
                {contextualInsights.optimization_tips && (
                  <div>
                    <h4 className={`font-medium mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Optimization Tips
                    </h4>
                    <div className="space-y-2">
                      {contextualInsights.optimization_tips.map((tip: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {tip}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {contextualInsights.warnings && contextualInsights.warnings.length > 0 && (
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className={`font-medium text-sm ${
                        darkMode ? 'text-red-300' : 'text-red-700'
                      }`}>
                        Productivity Alerts
                      </span>
                    </div>
                    <div className="space-y-1">
                      {contextualInsights.warnings.map((warning: string, index: number) => (
                        <p key={index} className={`text-sm ${
                          darkMode ? 'text-red-200' : 'text-red-600'
                        }`}>
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Getting contextual insights...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIInsightsPanel;
