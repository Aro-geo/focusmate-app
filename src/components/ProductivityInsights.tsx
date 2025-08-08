import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Clock, Target, Lightbulb, RefreshCw } from 'lucide-react';
import PersonalizedAIService from '../services/PersonalizedAIService';
import { useAuth } from '../context/AuthContext';

interface ProductivityInsightsProps {
  tasks: any[];
  sessions: any[];
}

const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({ tasks, sessions }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateInsights = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const habits = await PersonalizedAIService.analyzeUserHabits(user.id, tasks, sessions);
      const insights = await PersonalizedAIService.generateProductivityRecommendations(habits);
      setRecommendations(insights);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 || sessions.length > 0) {
      generateInsights();
    }
  }, [tasks.length, sessions.length, user]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'work_interval': return Clock;
      case 'break_interval': return RefreshCw;
      case 'task_priority': return Target;
      case 'daily_routine': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const getRecommendationColor = (confidence: number) => {
    if (confidence >= 0.8) return 'from-green-500 to-emerald-600';
    if (confidence >= 0.6) return 'from-blue-500 to-indigo-600';
    return 'from-yellow-500 to-orange-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Productivity Insights</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <motion.button
            onClick={generateInsights}
            disabled={isLoading}
            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600 dark:text-gray-300">Analyzing your productivity patterns...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const Icon = getRecommendationIcon(rec.type);
            const colorClass = getRecommendationColor(rec.confidence);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-5`} />
                
                <div className="relative p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{rec.title}</h4>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {rec.description}
                      </p>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Lightbulb className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Recommendation</span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                          {rec.actionable}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">No insights available yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete some tasks and focus sessions to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductivityInsights;