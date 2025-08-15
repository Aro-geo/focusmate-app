import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Activity,
  Brain,
  Database,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number }>;
  userActivity: Array<{ date: string; sessions: number }>;
  topFeatures: Array<{ feature: string; usage: number }>;
  retentionRate: number;
}

interface AdminAnalyticsProps {
  data: AnalyticsData | null;
  onRefresh: () => void;
  darkMode: boolean;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ data, onRefresh, darkMode }) => {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'sessions' | 'features'>('users');

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                User Growth (30 days)
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                +{data.userGrowth.reduce((sum, day) => sum + day.users, 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: '75%' }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-green-500">+15%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Retention Rate
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {(data.retentionRate * 100).toFixed(1)}%
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.retentionRate * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-blue-500">Good</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Weekly Sessions
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {data.userActivity.reduce((sum, day) => sum + day.sessions, 0).toLocaleString()}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: '85%' }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-purple-500">+8%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature Usage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Feature Usage
          </h3>
          <button
            onClick={onRefresh}
            className={`flex items-center px-3 py-1 rounded text-sm transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="space-y-4">
          {data.topFeatures.map((feature, index) => (
            <div key={feature.feature} className="flex items-center">
              <div className="w-32 text-sm font-medium">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {feature.feature}
                </span>
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div 
                    className={`h-3 rounded-full ${
                      index === 0 ? 'bg-indigo-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' :
                      'bg-gray-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${feature.usage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  ></motion.div>
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.usage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* User Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
      >
        <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Weekly Activity
        </h3>
        <div className="flex items-end space-x-2 h-32">
          {data.userActivity.map((day, index) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <motion.div
                className="w-full bg-indigo-500 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${(day.sessions / Math.max(...data.userActivity.map(d => d.sessions))) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              ></motion.div>
              <span className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;