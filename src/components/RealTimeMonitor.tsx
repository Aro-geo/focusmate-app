import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Database,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff
} from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  systemLoad: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

interface RealTimeMonitorProps {
  darkMode: boolean;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ darkMode }) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    requestsPerMinute: 0,
    averageResponseTime: 0,
    errorRate: 0,
    systemLoad: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0
  });
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        activeUsers: Math.max(0, prev.activeUsers + Math.floor(Math.random() * 10 - 5)),
        requestsPerMinute: Math.max(0, Math.floor(Math.random() * 100 + 50)),
        averageResponseTime: Math.max(100, Math.floor(Math.random() * 1000 + 500)),
        errorRate: Math.max(0, Math.min(10, Math.random() * 5)),
        systemLoad: Math.max(0, Math.min(100, Math.random() * 80 + 10)),
        memoryUsage: Math.max(0, Math.min(100, Math.random() * 70 + 20)),
        cpuUsage: Math.max(0, Math.min(100, Math.random() * 60 + 15)),
        networkLatency: Math.max(10, Math.floor(Math.random() * 100 + 20))
      }));
      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBg = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Real-time Monitoring
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Users */}
        <motion.div
          key={metrics.activeUsers}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Users
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {metrics.activeUsers}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">Live</span>
          </div>
        </motion.div>

        {/* Requests per Minute */}
        <motion.div
          key={metrics.requestsPerMinute}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Requests/min
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {metrics.requestsPerMinute}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center">
            <Zap className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-sm text-purple-500">Real-time</span>
          </div>
        </motion.div>

        {/* Response Time */}
        <motion.div
          key={metrics.averageResponseTime}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Avg Response
              </p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.averageResponseTime, { good: 500, warning: 1000 })}`}>
                {metrics.averageResponseTime}ms
              </p>
            </div>
            <Database className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getStatusBg(metrics.averageResponseTime, { good: 500, warning: 1000 })}`}
                style={{ width: `${Math.min(100, (metrics.averageResponseTime / 2000) * 100)}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Error Rate */}
        <motion.div
          key={metrics.errorRate}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Error Rate
              </p>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.errorRate, { good: 1, warning: 3 })}`}>
                {metrics.errorRate.toFixed(1)}%
              </p>
            </div>
            {metrics.errorRate <= 1 ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            )}
          </div>
          <div className="mt-2 flex items-center">
            {metrics.errorRate <= 1 ? (
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${metrics.errorRate <= 1 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.errorRate <= 1 ? 'Good' : 'High'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* System Resources */}
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          System Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPU Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                CPU Usage
              </span>
              <span className={`text-sm font-bold ${getStatusColor(metrics.cpuUsage, { good: 50, warning: 80 })}`}>
                {metrics.cpuUsage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div 
                className={`h-3 rounded-full transition-all duration-500 ${getStatusBg(metrics.cpuUsage, { good: 50, warning: 80 })}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.cpuUsage}%` }}
              ></motion.div>
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Memory Usage
              </span>
              <span className={`text-sm font-bold ${getStatusColor(metrics.memoryUsage, { good: 60, warning: 85 })}`}>
                {metrics.memoryUsage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div 
                className={`h-3 rounded-full transition-all duration-500 ${getStatusBg(metrics.memoryUsage, { good: 60, warning: 85 })}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.memoryUsage}%` }}
              ></motion.div>
            </div>
          </div>

          {/* System Load */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                System Load
              </span>
              <span className={`text-sm font-bold ${getStatusColor(metrics.systemLoad, { good: 40, warning: 70 })}`}>
                {metrics.systemLoad.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div 
                className={`h-3 rounded-full transition-all duration-500 ${getStatusBg(metrics.systemLoad, { good: 40, warning: 70 })}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.systemLoad}%` }}
              ></motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;